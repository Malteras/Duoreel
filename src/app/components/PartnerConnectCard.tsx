import { Loader2, Link as LinkIcon, Copy, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface OutgoingRequest {
  toUserId: string;
  toEmail?: string;
}

interface PartnerConnectCardProps {
  inviteCode: string;
  onCopyLink: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
  partnerEmail: string;
  onPartnerEmailChange: (email: string) => void;
  onSendRequest: () => void;
  sending: boolean;
  outgoingRequests: OutgoingRequest[];
  /** Unique id for the email <input> — avoids duplicate-id warnings when both tabs mount */
  inputId?: string;
}

/**
 * Shared partner connection UI rendered inside SavedMoviesTab and MatchesTab.
 * Covers: pending request notice, invite link + copy/regenerate, OR divider,
 * and the email input / send request button.
 */
export function PartnerConnectCard({
  inviteCode,
  onCopyLink,
  onRegenerate,
  regenerating,
  partnerEmail,
  onPartnerEmailChange,
  onSendRequest,
  sending,
  outgoingRequests,
  inputId = 'partnerEmail',
}: PartnerConnectCardProps) {
  return (
    <div className="space-y-4">
      {/* Pending outgoing request notice */}
      {outgoingRequests.length > 0 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-blue-400 font-medium mb-1">Pending Request</p>
          {outgoingRequests.map((r) => (
            <p key={r.toUserId} className="text-slate-300 text-sm">
              Waiting for response from {r.toEmail || r.toUserId}
            </p>
          ))}
        </div>
      )}

      {/* Invite link section */}
      <div className="bg-slate-900/50 border border-slate-700 border-dashed rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <LinkIcon className="size-4 text-cyan-400" />
          <Label className="text-white font-semibold text-sm">Share Your Invite Link</Label>
        </div>

        {inviteCode ? (
          <>
            <div className="flex gap-2 mb-3">
              <Input
                value={`${window.location.origin}/invite/${inviteCode}`}
                readOnly
                className="bg-slate-800 border-slate-600 text-cyan-400 font-mono text-xs"
              />
              <Button
                onClick={onCopyLink}
                className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
              >
                <Copy className="size-4 mr-2" />
                Copy
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Send this link to your partner — they'll need to accept your request
              </p>
              <Button
                onClick={onRegenerate}
                disabled={regenerating}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                {regenerating
                  ? <Loader2 className="size-3 mr-1 animate-spin" />
                  : <RotateCcw className="size-3 mr-1" />}
                <span className="text-xs">Regenerate</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            <span>Loading invite code...</span>
          </div>
        )}
      </div>

      {/* OR divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-800 px-3 text-slate-500 font-semibold">
            or connect by email
          </span>
        </div>
      </div>

      {/* Email input */}
      <div className="space-y-2">
        <Label htmlFor={inputId} className="text-white text-sm">
          Partner's Email
        </Label>
        <div className="flex gap-2">
          <Input
            id={inputId}
            type="email"
            value={partnerEmail}
            onChange={(e) => onPartnerEmailChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSendRequest()}
            placeholder="partner@example.com"
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Button
            onClick={onSendRequest}
            disabled={sending || !partnerEmail || outgoingRequests.length > 0}
            className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
          >
            {sending
              ? <Loader2 className="size-4 mr-2 animate-spin" />
              : <LinkIcon className="size-4 mr-2" />}
            Send Request
          </Button>
        </div>
        <p className="text-xs text-slate-500">They'll need to accept your request</p>
      </div>
    </div>
  );
}
