'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MessageSquare } from 'lucide-react';

export function FeedbackDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Bug Report');
    const [recipientEmail, setRecipientEmail] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim() || !description.trim()) {
            toast({
                title: "Error",
                description: "Please fill in both title and description.",
                variant: "destructive",
            });
            return;
        }

        if (!recipientEmail.trim()) {
            toast({
                title: "Error",
                description: "Please provide your email for responses.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        const requestData = {
            title,
            description,
            category,
            recipientEmail,
            currentPage: window.location.pathname,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            language: navigator.language,
            platform: navigator.platform,
            cookiesEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            referrer: document.referrer || 'none',
            localTime: new Date().toString(),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };

        try {
            const response = await fetch('/api/bug-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Feedback submitted successfully. Thank you!",
                });
                setTitle('');
                setDescription('');
                setCategory('Bug Report');
                setRecipientEmail('');
                setOpen(false);
            } else {
                const errorData = await response.json();
                throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error: any) {
            console.error('Failed to submit feedback:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit feedback. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Feedback
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Send Feedback</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Input
                            placeholder="Feedback title..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Bug Report">Bug Report</SelectItem>
                                <SelectItem value="Feature Request">Feature Request</SelectItem>
                                <SelectItem value="UI/UX Feedback">UI/UX Feedback</SelectItem>
                                <SelectItem value="Performance">Performance Issue</SelectItem>
                                <SelectItem value="Game Logic">Game Logic</SelectItem>
                                <SelectItem value="Authentication">Authentication</SelectItem>
                                <SelectItem value="Data">Data Issue</SelectItem>
                                <SelectItem value="General Feedback">General Feedback</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                            Your Email (for responses)
                        </label>
                        <Input
                            type="email"
                            placeholder="your-email@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <Textarea
                            placeholder="Describe your feedback in detail..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Submitting..." : "Send Feedback"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
