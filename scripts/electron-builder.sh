#!/bin/bash
set -e

__dirname="$(CDPATH= cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Get electron version without 'v' prefix
electron_version=$(electron --version)
electron_version=${electron_version:1}

display_usage() {
    yarn electron-builder -- --help
}

if [ $# -le 1 ]; then
    display_usage
    exit 1
fi

if [[ ( $# == "--help") ||  $# == "-h" ]]; then
    display_usage
    exit 0
fi

# Detect platform and arch from arguments
export PLATFORM="linux"
export ARCH="x64"

for arg in "$@"; do
    case $arg in
        --windows) export PLATFORM="win32" ;;
        --macos) export PLATFORM="darwin" ;;
        --linux) export PLATFORM="linux" ;;
        --ia32) export ARCH="ia32" ;;
        --x64) export ARCH="x64" ;;
        --armv7l) export ARCH="armv7l" ;;
        --arm64) export ARCH="arm64" ;;
    esac
done

echo "Building for Platform: ${PLATFORM}, Arch: ${ARCH}"

# Set environment variables for cross-compilation
export npm_config_platform=${PLATFORM}
export npm_config_arch=${ARCH}
export npm_config_target_platform=${PLATFORM}
export npm_config_target_arch=${ARCH}

if [ "${PLATFORM}" == "win32" ]; then
    export OS=win
    export GYP_DEFINES="target_arch=${ARCH} OS=win"
    if [ "${ARCH}" == "ia32" ]; then
        export CC=i686-w64-mingw32-gcc
        export CXX="i686-w64-mingw32-g++ -std=gnu++20"
    else
        export CC=x86_64-w64-mingw32-gcc
        export CXX="x86_64-w64-mingw32-g++ -std=gnu++20"
    fi
    export CXXFLAGS="-std=gnu++20"
    echo "Using cross-compiler: $CC"
    $CC --version | head -n 1
fi

pushd "$__dirname/../dist/gsender"
echo "Cleaning up \"`pwd`/node_modules\""
rm -rf node_modules

echo "Installing packages for ${PLATFORM} ${ARCH}..."
# Use --ignore-scripts to prevent building for the host during install
yarn install --production --ignore-engines --ignore-scripts

if [ "${PLATFORM}" == "win32" ]; then
    echo "Patching Windows header casing in node_modules..."
    # Fix case sensitivity for Windows headers that are usually camel-case in code but lower-case in mingw
    find node_modules -type f \( -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \) -exec sed -i 's/Setupapi.h/setupapi.h/g' {} +
    find node_modules -type f \( -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \) -exec sed -i 's/Initguid.h/initguid.h/g' {} +
    find node_modules -type f \( -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \) -exec sed -i 's/Devpkey.h/devpkey.h/g' {} +
    find node_modules -type f \( -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \) -exec sed -i 's/Devguid.h/devguid.h/g' {} +
    find node_modules -type f \( -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \) -exec sed -i 's/Windows.h/windows.h/g' {} +
    find node_modules -type f \( -name "*.cpp" -o -name "*.h" -o -name "*.hpp" \) -exec sed -i 's/WinError.h/winerror.h/g' {} +
    
    # Inject SAL annotation defines locally into serialport_win.cpp to avoid conflicts with std lib
    SAL_DEFINES="#ifndef __in\n#define __in\n#endif\n#ifndef __out\n#define __out\n#endif\n#ifndef __out_opt\n#define __out_opt\n#endif\n#ifndef __in_opt\n#define __in_opt\n#endif\n#ifndef __in_bcount\n#define __in_bcount(x)\n#endif\n#ifndef __out_bcount\n#define __out_bcount(x)\n#endif\n#ifndef __deref_out\n#define __deref_out\n#endif\n#ifndef __in_ecount\n#define __in_ecount(x)\n#endif\n#ifndef __out_ecount\n#define __out_ecount(x)\n#endif\n#ifndef __in_bcount_opt\n#define __in_bcount_opt(x)\n#endif\n#ifndef __out_bcount_opt\n#define __out_bcount_opt(x)\n#endif"
    
    sed -i "s/#pragma comment(lib, \"setupapi.lib\")/$SAL_DEFINES\n#pragma comment(lib, \"setupapi.lib\")/g" node_modules/@serialport/bindings-cpp/src/serialport_win.cpp
    
    # Disable win_delay_load_hook in binding.gyp to avoid "No rule to make target" error with absolute paths
    sed -i "s/'target_name': 'bindings',/'target_name': 'bindings', 'win_delay_load_hook': 'false',/g" node_modules/@serialport/bindings-cpp/binding.gyp
fi
popd

echo "Rebuild native modules using electron ${electron_version} for ${PLATFORM} ${ARCH}"
# Export flags to ensure they are picked up by node-gyp
export CFLAGS="-D_hypot=hypot"
export CXXFLAGS="-std=gnu++20 -D_hypot=hypot"
export LDFLAGS="-static-libgcc -static-libstdc++"

# First, let gyp generate the Makefile
CC="$CC" CXX="$CXX" CXXFLAGS="$CXXFLAGS" yarn electron-rebuild \
    --version=${electron_version} \
    --module-dir=dist/gsender \
    --arch=${ARCH} \
    --platform=${PLATFORM} \
    --only=@serialport/bindings-cpp \
    --prebuild-tag-prefix=@serialport/bindings-cpp@ \
    --force || true

# Now patch the generated Makefile to use MinGW library names instead of MSVC .lib files
if [ -f "dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk" ]; then
    echo "Patching Makefile to use MinGW-compatible library names..."
    sed -i 's/-lkernel32\.lib/-lkernel32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-luser32\.lib/-luser32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-lgdi32\.lib/-lgdi32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-lwinspool\.lib/-lwinspool/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-lcomdlg32\.lib/-lcomdlg32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-ladvapi32\.lib/-ladvapi32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-lshell32\.lib/-lshell32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-lole32\.lib/-lole32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-loleaut32\.lib/-loleaut32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-luuid\.lib/-luuid/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-lodbc32\.lib/-lodbc32/g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-lDelayImp\.lib//g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    sed -i 's/-l"\/home\/op\/\.electron-gyp.*node\.lib"//g' dist/gsender/node_modules/@serialport/bindings-cpp/build/bindings.target.mk
    
    # Re-run the build now that the Makefile is fixed
    CC="$CC" CXX="$CXX" CXXFLAGS="$CXXFLAGS" yarn electron-rebuild \
        --version=${electron_version} \
        --module-dir=dist/gsender \
        --arch=${ARCH} \
        --platform=${PLATFORM}
fi

cross-env USE_HARD_LINKS=false yarn electron-builder -- "$@"
