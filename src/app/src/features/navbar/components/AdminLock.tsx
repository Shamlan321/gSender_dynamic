import { useState, useEffect } from 'react';
import isElectron from 'is-electron';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from 'app/components/shadcn/Dialog';
import { Input } from 'app/components/shadcn/Input';
import { Button } from 'app/components/shadcn/Button';
import { Label } from 'app/components/shadcn/Label';

interface AdminLockProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function AdminLock({ open, onOpenChange, onSuccess }: AdminLockProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSetting, setIsSetting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open) {
            setPassword('');
            setConfirmPassword('');
            setError('');
            setIsLoading(true);

            if (!isElectron()) {
                console.warn("Admin lock is not available in non-electron environment.");
                // In non-electron, we just allow success for development/preview purposes
                // or handle it as you wish. Here I'll just let it pass if not in electron
                // so the user isn't stuck.
                onSuccess();
                onOpenChange(false);
                return;
            }

            // Check if password exists
            (window as any).ipcRenderer.invoke('admin:check-password-exists')
                .then((exists: boolean) => {
                    setIsSetting(!exists);
                    setIsLoading(false);
                })
                .catch((err: any) => {
                    console.error("Failed to check admin password:", err);
                    setError("Failed to check system status.");
                    setIsLoading(false);
                });
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isElectron()) {
            onSuccess();
            onOpenChange(false);
            return;
        }

        if (isSetting) {
            if (!password) {
                setError('Password cannot be empty');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            try {
                const success = await (window as any).ipcRenderer.invoke('admin:set-password', password);
                if (success) {
                    onSuccess();
                    onOpenChange(false);
                } else {
                    setError('Failed to set password');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred');
            }
        } else {
            try {
                const isValid = await (window as any).ipcRenderer.invoke('admin:verify-password', password);
                if (isValid) {
                    onSuccess();
                    onOpenChange(false);
                } else {
                    setError('Incorrect password');
                }
            } catch (err) {
                console.error(err);
                setError('An error occurred');
            }
        }
    };

    if (isLoading) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>
                            {isSetting ? 'Set Admin Password' : 'Admin Access'}
                        </DialogTitle>
                        <DialogDescription>
                            {isSetting
                                ? 'Set a password to secure the configuration settings.'
                                : 'Enter your admin password to access configuration.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="col-span-3"
                                autoFocus
                            />
                        </div>
                        {isSetting && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="confirm" className="text-right">
                                    Confirm
                                </Label>
                                <Input
                                    id="confirm"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="col-span-3"
                                />
                            </div>
                        )}
                        {error && (
                            <div className="text-red-500 text-sm text-center">
                                {error}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="submit">
                            {isSetting ? 'Set Password' : 'Unlock'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
