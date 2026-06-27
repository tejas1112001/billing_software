import React, { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { api } from '@/services/api';
import { toast } from 'sonner';

export default function ResetDataPage() {
  const [confirmationText, setConfirmationText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleResetClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmReset = async () => {
    if (confirmationText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }

    setIsResetting(true);
    try {
      const response = await api.post('/admin/reset-data');
      toast.success(response.data.message || 'Data reset successfully');
      setConfirmationText('');
      setShowConfirmation(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to reset data');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCancel = () => {
    setConfirmationText('');
    setShowConfirmation(false);
  };

  return (
    <div>
      <PageHeader
        title="Reset All Data"
        description="Clear all data except user accounts"
      />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            This action will permanently delete all data from the system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warning</AlertTitle>
            <AlertDescription>
              This will delete all:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Brands, Categories, and Products</li>
                <li>Orders and Receipts</li>
                <li>Stores and Ledger Entries</li>
                <li>Payment Methods</li>
                <li>Audit Logs</li>
              </ul>
              <p className="mt-2 font-semibold">User accounts will be preserved.</p>
            </AlertDescription>
          </Alert>

          {!showConfirmation ? (
            <Button
              variant="destructive"
              onClick={handleResetClick}
              className="w-full"
            >
              Reset All Data
            </Button>
          ) : (
            <div className="space-y-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="confirmation">
                  Type <span className="font-mono font-bold">RESET</span> to confirm
                </Label>
                <Input
                  id="confirmation"
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Type RESET"
                  disabled={isResetting}
                  className="font-mono"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isResetting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmReset}
                  disabled={confirmationText !== 'RESET' || isResetting}
                  className="flex-1"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Confirm Reset'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
