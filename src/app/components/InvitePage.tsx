import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Loader2, Heart, AlertCircle, Home } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { projectId } from '/utils/supabase/info';

type InviteStatus = 
  | 'loading' 
  | 'success' 
  | 'error' 
  | 'self_invite' 
  | 'already_connected'
  | 'inviter_connected';

export function InvitePage() {
  const { code } = useParams<{ code: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<InviteStatus>('loading');
  const [partnerName, setPartnerName] = useState('');

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-5623fde1`;

  useEffect(() => {
    // Not logged in — redirect to login, preserve invite in URL
    if (!accessToken) {
      navigate(`/login?redirect=/invite/${code}`, { replace: true });
      return;
    }

    // Logged in — accept the invite
    const acceptInvite = async () => {
      try {
        const res = await fetch(`${baseUrl}/partner/accept-invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.ok) {
          setPartnerName(data.inviterName);
          
          if (data.alreadySent) {
            setStatus('success');
            toast.info(`You've already sent a request to ${data.inviterName}`);
          } else {
            setStatus('success');
            toast.success(`🎬 Request sent to ${data.inviterName}!`);
          }
          
          // Redirect to discover after 3 seconds
          setTimeout(() => navigate('/discover'), 3000);
        } else if (data.error === 'self_invite') {
          setStatus('self_invite');
          toast.error("That's your own invite link!");
        } else if (data.error === 'already_connected') {
          setStatus('already_connected');
          toast.error("You're already connected with a partner");
        } else if (data.error === 'inviter_connected') {
          setPartnerName(data.inviterName || 'This user');
          setStatus('inviter_connected');
          toast.error(`${data.inviterName || 'This user'} is already connected with someone else`);
        } else {
          setStatus('error');
          toast.error('Invalid or expired invite link');
        }
      } catch (error) {
        console.error('Error accepting invite:', error);
        setStatus('error');
        toast.error('Failed to accept invite');
      }
    };

    acceptInvite();
  }, [accessToken, code]);

  // ─── Loading State ────────────────────────────────────────
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="size-16 text-pink-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Processing invite link...</p>
        </div>
      </div>
    );
  }

  // ─── Success State ────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🎬</div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Request sent to <span className="text-pink-500">{partnerName}</span>!
          </h1>
          <p className="text-slate-400 mb-8">
            They'll get a notification and can accept your request. You'll both be notified when connected.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
            <Loader2 className="size-4 animate-spin" />
            <span>Redirecting to Discover...</span>
          </div>
          <Button
            onClick={() => navigate('/discover')}
            className="bg-pink-600 hover:bg-pink-700"
          >
            Go to Discover Now →
          </Button>
        </div>
      </div>
    );
  }

  // ─── Self Invite Error ────────────────────────────────────
  if (status === 'self_invite') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🔗</div>
          <h1 className="text-3xl font-bold text-white mb-3">
            That's Your Own Link!
          </h1>
          <p className="text-slate-400 mb-8">
            This is your personal invite link. Share it with your partner instead!
          </p>
          <Button
            onClick={() => navigate('/profile')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Profile →
          </Button>
        </div>
      </div>
    );
  }

  // ─── Already Connected Error ──────────────────────────────
  if (status === 'already_connected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">💚</div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Already Connected
          </h1>
          <p className="text-slate-400 mb-8">
            You're already connected with a partner. Disconnect first to connect with someone else.
          </p>
          <Button
            onClick={() => navigate('/matches')}
            className="bg-green-600 hover:bg-green-700"
          >
            View Your Matches →
          </Button>
        </div>
      </div>
    );
  }

  // ─── Inviter Connected Error ──────────────────────────────
  if (status === 'inviter_connected') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">💔</div>
          <h1 className="text-3xl font-bold text-white mb-3">
            Partner Already Connected
          </h1>
          <p className="text-slate-400 mb-8">
            {partnerName} is already connected with someone else.
          </p>
          <Button
            onClick={() => navigate('/discover')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Go to Discover →
          </Button>
        </div>
      </div>
    );
  }

  // ─── Invalid Link Error ───────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <AlertCircle className="size-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-3">
          Invalid Invite Link
        </h1>
        <p className="text-slate-400 mb-8">
          This invite link doesn't exist or has been regenerated.
        </p>
        <Button
          onClick={() => navigate('/discover')}
          variant="outline"
          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
        >
          <Home className="size-4 mr-2" />
          Go to Discover
        </Button>
      </div>
    </div>
  );
}
