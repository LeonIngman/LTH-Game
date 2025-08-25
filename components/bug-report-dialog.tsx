'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { MessageSquare, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function FeedbackDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [lastError, setLastError] = useState<any>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: "Debug information copied to clipboard.",
      });
    });
  };

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

    setLoading(true);
    setDebugInfo(null);
    setLastError(null);

    const requestData = {
      title,
      description,
      category,
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

    // Store debug info for display
    setDebugInfo({
      request: requestData,
      endpoint: '/api/bug-report',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    try {
      console.log('🐛 Submitting feedback:', requestData);

      const response = await fetch('/api/bug-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = { rawResponse: responseText, parseError: parseError.message };
      }

      // Update debug info with response
      setDebugInfo(prev => ({
        ...prev,
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data: responseData,
          ok: response.ok,
        }
      }));

      console.log('🐛 Feedback response:', {
        status: response.status,
        statusText: response.statusText,
        data: responseData
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Feedback submitted successfully. Thank you!",
        });
        setTitle('');
        setDescription('');
        setCategory('Other');
        setOpen(false);
        setDebugInfo(null);
        setLastError(null);
      } else {
        const errorMessage = responseData?.error || responseData?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error('🐛 Feedback submission error:', error);

      const errorDetails = {
        message: error.message,
        stack: error.stack,
        name: error.name,
        cause: error.cause,
        type: error.constructor.name,
        timestamp: new Date().toISOString(),
        // Network specific errors
        ...(error.cause && { networkError: error.cause }),
        // Fetch specific errors
        ...(error.name === 'TypeError' && { possibleCause: 'Network error or CORS issue' }),
      };

      setLastError(errorDetails);
      setDebugInfo(prev => ({
        ...prev,
        error: errorDetails
      }));

      toast({
        title: "Error",
        description: `Failed to submit feedback: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <MessageSquare className="h-4 w-4 mr-2" />
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
            <Textarea
              placeholder="Describe your feedback in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>

          {/* Debug Information Section */}
          {(debugInfo || lastError) && (
            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowDebugInfo(!showDebugInfo)}
                className="flex items-center gap-2 mb-2"
              >
                {showDebugInfo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                Debug Information {lastError && '(Error)'}
              </Button>

              {showDebugInfo && (
                <div className="space-y-4">
                  {lastError && (
                    <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                      <AlertDescription>
                        <div className="space-y-2">
                          <div className="font-semibold text-red-800 dark:text-red-200">
                            Error Details:
                          </div>
                          <div className="font-mono text-sm bg-red-100 dark:bg-red-900/30 p-2 rounded">
                            <div><strong>Message:</strong> {lastError.message}</div>
                            <div><strong>Type:</strong> {lastError.type}</div>
                            <div><strong>Time:</strong> {lastError.timestamp}</div>
                            {lastError.possibleCause && (
                              <div><strong>Possible Cause:</strong> {lastError.possibleCause}</div>
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => copyToClipboard(JSON.stringify(lastError, null, 2))}
                            className="flex items-center gap-1"
                          >
                            <Copy className="h-3 w-3" />
                            Copy Error Details
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  {debugInfo && (
                    <div className="space-y-3">
                      <div className="font-semibold">Request Information:</div>
                      <div className="font-mono text-xs bg-gray-100 dark:bg-gray-800 p-3 rounded overflow-x-auto">
                        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(debugInfo, null, 2))}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copy Debug Info
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(`
**Feedback Submission Debug Report**

**Error:** ${lastError ? lastError.message : 'None'}

**Request Details:**
\`\`\`json
${JSON.stringify(debugInfo, null, 2)}
\`\`\`

**Error Details:**
\`\`\`json
${lastError ? JSON.stringify(lastError, null, 2) : 'No errors'}
\`\`\`

**Environment:**
- Browser: ${navigator.userAgent}
- URL: ${window.location.href}
- Time: ${new Date().toISOString()}
                          `.trim())}
                          className="flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          Copy Formatted Report
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
