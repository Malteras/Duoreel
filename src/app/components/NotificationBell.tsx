import { useState, useEffect, useCallback, useRef } from 'react';
import { Bell, Check, Heart, Users, Loader2, ExternalLink, PartyPopper, CheckCircle, XCircle, Upload } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { API_BASE_URL } from '../../utils/api';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

interface NotificationBellProps {
  accessToken: string;
}

interface Notification {
  id: string;
  type: 'partnership_request' | 'partnership_accepted' | 'movie_match' | 'match_milestone' | 'import_complete';
  read: boolean;
  createdAt: number;
  data: {
    fromUserId?: string;
    fromName?: string;
    movieId?: number;
    movieTitle?: string;
    posterPath?: string;
    milestoneCount?: number;
    importType?: string;
    importedCount?: number;
    failedCount?: number;
    totalCount?: number;
  };
}

export function NotificationBell({ accessToken }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [accessToken]);

  // Poll unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  const fetchNotifications = useCallback(
    async (reset = false) => {
      if (!accessToken) return;
      setLoading(true);

      const currentOffset = reset ? 0 : offset;

      try {
        const response = await fetch(
          `${API_BASE_URL}/notifications?limit=20&offset=${currentOffset}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        const data = await response.json();

        if (reset) {
          setNotifications(data.notifications || []);
          setOffset(20);
        } else {
          setNotifications((prev) => [...prev, ...(data.notifications || [])]);
          setOffset((prev) => prev + 20);
        }

        setHasMore(data.hasMore || false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    },
    [accessToken, offset]
  );

  // Load notifications when dropdown opens
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      fetchNotifications(true);
    }
  }, [isOpen]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || loading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100) {
      fetchNotifications(false);
    }
  }, [loading, hasMore, fetchNotifications]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/notifications/mark-all-read`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Mark single notification as read
  const markAsRead = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId);
    if (!notification || notification.read) return;

    try {
      await fetch(`${API_BASE_URL}/notifications/mark-read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Accept partner request
  const [acceptingRequest, setAcceptingRequest] = useState<string | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<string | null>(null);

  const handleAcceptRequest = async (e: React.MouseEvent, fromUserId: string, notificationId: string) => {
    e.stopPropagation();
    setAcceptingRequest(fromUserId);

    try {
      const response = await fetch(`${API_BASE_URL}/partner/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ fromUserId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('🎉 Partner request accepted!');
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        fetchUnreadCount();
        setTimeout(() => {
          setIsOpen(false);
          navigate('/matches');
        }, 500);
      } else {
        toast.error(data.error || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      toast.error('Failed to accept request');
    } finally {
      setAcceptingRequest(null);
    }
  };

  const handleRejectRequest = async (e: React.MouseEvent, fromUserId: string, notificationId: string) => {
    e.stopPropagation();
    setRejectingRequest(fromUserId);

    try {
      const response = await fetch(`${API_BASE_URL}/partner/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ fromUserId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Partner request rejected');
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        fetchUnreadCount();
      } else {
        toast.error(data.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setRejectingRequest(null);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.type === 'movie_match' && notification.data.movieId) {
      setIsOpen(false);
      navigate(`/matches?movie=${notification.data.movieId}`);
    } else if (
      notification.type === 'partnership_request' ||
      notification.type === 'partnership_accepted' ||
      notification.type === 'match_milestone'
    ) {
      setIsOpen(false);
      navigate('/matches');
    } else if (notification.type === 'import_complete') {
      setIsOpen(false);
      navigate(notification.data.importType === 'watched' ? '/discover' : '/saved');
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  // Render notification content
  const renderNotification = (notification: Notification) => {
    const { type, data, read } = notification;

    let icon: React.ReactNode;
    let message: React.ReactNode;

    switch (type) {
      case 'partnership_request':
        icon = (
          <div className="size-10 rounded-full bg-pink-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="size-5 text-pink-400" />
          </div>
        );
        message = (
          <>
            <strong className="text-white">{data.fromName}</strong> wants to be your movie
            partner
          </>
        );
        break;

      case 'partnership_accepted':
        icon = (
          <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Check className="size-5 text-blue-400" />
          </div>
        );
        message = (
          <>
            <strong className="text-white">{data.fromName}</strong> accepted your partner
            request!
          </>
        );
        break;

      case 'movie_match':
        icon = data.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w92${data.posterPath}`}
            alt={data.movieTitle}
            className="size-10 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="size-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <Heart className="size-5 text-green-400" />
          </div>
        );
        message = (
          <>
            <strong className="text-green-400">It's a match!</strong> You and{' '}
            <strong className="text-white">{data.fromName}</strong> both saved{' '}
            <strong className="text-white">{data.movieTitle}</strong>
          </>
        );
        break;

      case 'match_milestone':
        icon = (
          <div className="size-10 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <PartyPopper className="size-5 text-purple-400" />
          </div>
        );
        message = (
          <>
            <strong className="text-purple-400">🎉 {data.milestoneCount} matches</strong> with{' '}
            <strong className="text-white">{data.fromName}</strong>!
          </>
        );
        break;

      case 'import_complete':
        icon = (
          <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Upload className="size-5 text-blue-400" />
          </div>
        );
        const importLabel = data.importType === 'watched' ? 'watched movies' : 'watchlist';
        message = data.failedCount && data.failedCount > 0 ? (
          <>
            <strong className="text-emerald-400">Import complete!</strong>{' '}
            {data.importedCount} of {data.totalCount} {importLabel} imported
            successfully. We couldn't find {data.failedCount} movies on TMDb.
          </>
        ) : (
          <>
            <strong className="text-emerald-400">Import complete!</strong>{' '}
            All {data.importedCount} {importLabel} imported successfully!
          </>
        );
        break;

      default:
        return null;
    }

    // Special rendering for partnership_request with action buttons
    if (type === 'partnership_request' && data.fromUserId) {
      return (
        <div
          key={notification.id}
          className={`flex gap-3 p-3 rounded-lg transition-colors ${
            !read
              ? 'bg-blue-500/10 border-l-2 border-blue-500'
              : 'bg-slate-800/50'
          }`}
        >
          {icon}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
            <p className="text-xs text-slate-500 mt-1 mb-2">{formatTime(notification.createdAt)}</p>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={(e) => handleAcceptRequest(e, data.fromUserId!, notification.id)}
                disabled={acceptingRequest === data.fromUserId || rejectingRequest === data.fromUserId}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white h-8 text-xs"
              >
                {acceptingRequest === data.fromUserId ? (
                  <><Loader2 className="size-3 mr-1 animate-spin" /> Accepting...</>
                ) : (
                  <><CheckCircle className="size-3 mr-1" /> Accept</>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => handleRejectRequest(e, data.fromUserId!, notification.id)}
                disabled={acceptingRequest === data.fromUserId || rejectingRequest === data.fromUserId}
                className="flex-1 bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-300 h-8 text-xs"
              >
                {rejectingRequest === data.fromUserId ? (
                  <><Loader2 className="size-3 mr-1 animate-spin" /> Rejecting...</>
                ) : (
                  <><XCircle className="size-3 mr-1" /> Reject</>
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={notification.id}
        onClick={() => handleNotificationClick(notification)}
        className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
          !read
            ? 'bg-blue-500/10 border-l-2 border-blue-500 hover:bg-blue-500/15'
            : 'hover:bg-slate-700/50'
        }`}
      >
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          <p className="text-xs text-slate-500 mt-1">{formatTime(notification.createdAt)}</p>
        </div>
      </div>
    );
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="relative size-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition-colors">
          <Bell className="size-5 text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full size-5 flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] max-h-[500px] bg-slate-800 border-slate-700 p-0"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notification list */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="max-h-[400px] overflow-y-auto p-2 space-y-1"
        >
          {notifications.length === 0 && !loading ? (
            <div className="py-12 text-center">
              <Bell className="size-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No notifications yet</p>
            </div>
          ) : (
            <>
              {notifications.map(renderNotification)}
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="size-5 text-slate-400 animate-spin" />
                </div>
              )}
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
