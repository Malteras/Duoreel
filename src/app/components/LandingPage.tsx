import { useNavigate, Navigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Film,
  ThumbsUp,
  Users,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  LinkIcon,
  Star,
  Upload,
  FileText,
} from "lucide-react";
import { Heart } from "lucide-react";
import duoReelLogo from "figma:asset/65ac31667d93e024af4b11b9531ae9e7cbf4dc67.png";

export function LandingPage() {
  const navigate = useNavigate();
  const { accessToken, loading } = useAuth();
  const onGetStarted = () => navigate('/login');

  // Redirect logged-in users straight into the app
  if (!loading && accessToken) return <Navigate to="/discover" replace />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" style={{ minHeight: '100dvh' }}>
      {/* Fixed Header Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <img src={duoReelLogo} alt="DuoReel" className="h-10 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  <span className="text-pink-400">Duo</span>Reel
                </h1>
                <p className="text-sm text-slate-400">Find movies you both love</p>
              </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#how-it-works" className="text-slate-300 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#why-duoreel" className="text-slate-300 hover:text-white transition-colors">
                Why DuoReel
              </a>
              <a href="#features" className="text-slate-300 hover:text-white transition-colors">
                Features
              </a>
              <Button 
                onClick={onGetStarted}
                className="bg-pink-600 hover:bg-pink-700 text-white font-semibold"
              >
                Get Started
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-20">
        {/* Movie Poster Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 grid grid-cols-8 gap-0 opacity-70"
            style={{
              transform:
                "perspective(1200px) rotateY(-15deg) rotateX(10deg) scale(1.4)",
              transformOrigin: "center center",
              minHeight: "120%",
            }}
          >
            {/* Row 1 */}
            <img
              src="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/npMcVR3ykKRtofGrf6rraNbwPTw.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iYypPT4bhqXTt1zOIC8FqEU2r4R.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 2 */}
            <img
              src="https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/xBKGJQsAIeweesB79KC89FpBrVr.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/cezWGskPY5x7GaglTTRN4Fugfb8.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lMyv7XAwXeJZXF9xw8JS9g3Iibb.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 3 */}
            <img
              src="https://image.tmdb.org/t/p/w500/aWeKITRFbbwY8txG5uCj4rMCfSR.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/dqK9Hag1054tghRQSqLSfrkvQnA.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef0kZjFOQ5.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lHu1wtNaczFPGFDTrjCSzeLPTKN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/db32LaOibwEliAmSL2jjDF6oDdj.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fev8UFNFFYsD5q7AcYS8LyTzqwl.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 4 */}
            <img
              src="https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fqe8v8ME0z0CiU7sf6vxToAfOCh.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/tVxDe01Zy3kZqaZRNiXFGDICdZk.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 5 */}
            <img
              src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ipc1O5rMpALxH1rJHnvvmpapo37.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89WW2Di64Ym.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/gzlJkVfWV5VEG5xK25cvFGJgkDz.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          {/* Logo and Title */}
          <div
            className="text-center mb-32 backdrop-blur-lg rounded-[20px] border border-slate-700/30 px-[32px] py-[92px]"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(10px)",
            }}
          >
            <img
              src={duoReelLogo}
              alt="DuoReel"
              className="h-32 w-auto mx-auto mb-8"
            />
            <p className="text-2xl sm:text-3xl text-slate-300 mb-4">
              Find movies you{" "}
              <span className="text-pink-400 font-semibold">
                both
              </span>{" "}
              love
            </p>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Stop spending hours deciding what to watch. Swipe
              through movies,{" "}
              <span className="font-bold">
                match with your partner
              </span>
              , and discover your{" "}
              <span className="font-bold">
                next perfect movie
              </span>{" "}
              night together.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGetStarted}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-6 shadow-xl shadow-blue-500/30"
              >
                Get Started Free
                <ArrowRight className="size-5 ml-2" />
              </Button>
              <Button
                onClick={onGetStarted}
                size="lg"
                variant="outline"
                className="bg-slate-800/50 border-slate-700 text-white text-lg px-8 py-6 hover:bg-slate-700/50 hover:text-white"
              >
                Sign In
              </Button>
            </div>
          </div>

          {/* How It Works Section Title */}
          <div id="how-it-works" className="mb-12 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-4xl font-bold text-slate-200">
                <span className="text-pink-400">How</span> it
                works?
              </h2>
            </div>
            <div className="ml-6 w-32 h-1 bg-gradient-to-r from-pink-500/50 to-transparent rounded-full"></div>
          </div>

          {/* How It Works Steps */}
          <div className="max-w-5xl mx-auto mb-32">
            {/* Step 1 - Create Account */}
            <div className="relative flex gap-8 mb-16">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/50 relative z-10">
                  <span className="text-white text-2xl font-bold">
                    1
                  </span>
                </div>
                <div className="w-1 flex-1 bg-gradient-to-b from-blue-500/50 to-purple-500/50 mt-4"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Create Account
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Sign up with your email and password to get
                  started
                </p>
              </div>
            </div>

            {/* Step 2 - Connect with Partner */}
            <div className="relative flex gap-8 mb-16">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-full flex items-center justify-center shadow-2xl shadow-purple-500/50 relative z-10">
                  <span className="text-white text-2xl font-bold">
                    2
                  </span>
                </div>
                <div className="w-1 flex-1 bg-gradient-to-b from-purple-500/50 to-pink-500/50 mt-4"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Connect with Partner
                </h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Add your partner by sending them an email
                  invitation
                </p>
                {/* Mock UI Preview */}
                <div className="backdrop-blur-lg rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 max-w-md">
                  <div className="text-sm text-slate-400 mb-2">
                    Profile Tab
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/30">
                    <div className="text-xs text-slate-400 mb-2">
                      Partner Email
                    </div>
                    <input
                      type="text"
                      value="partner@example.com"
                      readOnly
                      className="w-full bg-slate-900/50 border border-slate-600/50 rounded px-3 py-2 text-white text-sm mb-2"
                    />
                    <button className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg py-2 text-sm font-medium">
                      Send Invitation
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 - Partner Receives Email */}
            <div className="relative flex gap-8 mb-16">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-2xl shadow-pink-500/50 relative z-10">
                  <span className="text-white text-2xl font-bold">
                    3
                  </span>
                </div>
                <div className="w-1 flex-1 bg-gradient-to-b from-pink-500/50 to-orange-500/50 mt-4"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Partner Receives Email & Creates Account
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Your partner opens the invitation, creates
                  their account, and you're automatically
                  connected
                </p>
              </div>
            </div>

            {/* Step 4 - Like Movies */}
            <div className="relative flex gap-8 mb-16">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50 relative z-10">
                  <span className="text-white text-2xl font-bold">
                    4
                  </span>
                </div>
                <div className="w-1 flex-1 bg-gradient-to-b from-orange-500/50 to-green-500/50 mt-4"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Browse & Like Movies
                </h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Browse through thousands of movies and mark
                  the ones you'd like to watch
                </p>
                {/* Browse Movies UI Preview */}
                <div className="backdrop-blur-lg rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 max-w-md">
                  <div className="grid grid-cols-2 gap-3">
                    {/* Movie Card 1 - Stalker */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-slate-700/50 shadow-xl">
                      <div className="aspect-[2/3] relative overflow-hidden">
                        <img
                          src="https://cdn.printerval.com/unsafe/960x960/asset/111049560a1d1c1a0d1a1a141d56161d0c571115191f1d564b4d484c4c4e414e414c56414d4f4a571e14190c544f4d480054484f4d541e5508191c544f4d480049484848541e401e401e405612081f"
                          alt="Stalker"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 bg-slate-900/80 backdrop-blur-sm">
                        <div className="text-white text-sm font-semibold mb-1">
                          Stalker
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-slate-400">
                            8.0
                          </span>
                        </div>
                        <div className="bg-green-600 rounded py-1.5 text-center text-white text-xs font-medium flex items-center justify-center gap-1 shadow-lg shadow-green-500/20">
                          <Heart className="size-3" />
                          Like
                        </div>
                      </div>
                    </div>
                    {/* Movie Card 2 - The Matrix */}
                    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-lg overflow-hidden border border-slate-700/50 shadow-xl">
                      <div className="aspect-[2/3] relative overflow-hidden">
                        <img
                          src="https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg"
                          alt="The Matrix"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-2 bg-slate-900/80 backdrop-blur-sm">
                        <div className="text-white text-sm font-semibold mb-1">
                          The Matrix
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="size-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-slate-400">
                            8.7
                          </span>
                        </div>
                        <div className="bg-green-600 rounded py-1.5 text-center text-white text-xs font-medium flex items-center justify-center gap-1 shadow-lg shadow-green-500/20">
                          <Heart className="size-3" />
                          Like
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 text-center mt-3">
                    Filter by genre, decade & rating
                  </p>
                </div>
              </div>
            </div>

            {/* Step 5 - Get Matches */}
            <div className="relative flex gap-8 mb-16">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-green-500/50 relative z-10">
                  <span className="text-white text-2xl font-bold">
                    5
                  </span>
                </div>
                <div className="w-1 flex-1 bg-gradient-to-b from-green-500/50 to-cyan-500/50 mt-4"></div>
              </div>
              <div className="flex-1 pb-8">
                <h3 className="text-2xl font-bold text-white mb-3">
                  See Your Matches!
                </h3>
                <p className="text-slate-300 leading-relaxed mb-4">
                  Get instant notifications when you both like
                  the same movie
                </p>
                {/* Matches UI Preview */}
                <div className="backdrop-blur-lg rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 max-w-md">
                  <div className="space-y-3">
                    {/* Match Item - Stalker */}
                    <div className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 backdrop-blur-sm border border-pink-500/50 rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 shadow-lg">
                          <img
                            src="https://cdn.printerval.com/unsafe/960x960/asset/111049560a1d1c1a0d1a1a141d56161d0c571115191f1d564b4d484c4c4e414e414c56414d4f4a571e14190c544f4d480054484f4d541e5508191c544f4d480049484848541e401e401e405612081f"
                            alt="Stalker"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="size-4 text-pink-400" />
                            <span className="text-pink-400 text-xs font-semibold">
                              MATCH!
                            </span>
                          </div>
                          <div className="text-white font-semibold text-sm">
                            Stalker
                          </div>
                          <div className="text-slate-400 text-xs">
                            You both saved this
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Another Match - Interstellar */}
                    <div className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 backdrop-blur-sm border border-pink-500/50 rounded-lg p-3 shadow-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-16 rounded overflow-hidden flex-shrink-0 shadow-lg">
                          <img
                            src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
                            alt="Interstellar"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="size-4 text-pink-400" />
                            <span className="text-pink-400 text-xs font-semibold">
                              MATCH!
                            </span>
                          </div>
                          <div className="text-white font-semibold text-sm">
                            Interstellar
                          </div>
                          <div className="text-slate-400 text-xs">
                            You both saved this
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-400 text-center mt-3">
                    No more endless scrolling!
                  </p>
                </div>
              </div>
            </div>

            {/* Step 6 - Watch Together */}
            <div className="relative flex gap-8">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl shadow-cyan-500/50 relative z-10">
                  <span className="text-2xl">🎉</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-3">
                  Watch Together 🥳
                </h3>
                <p className="text-slate-300 leading-relaxed">
                  Celebrate your matches and enjoy movie night
                  together!
                </p>
              </div>
            </div>
          </div>

          {/* Who Is It For / Who It's Not For Section */}
          <div className="mb-12 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-4xl font-bold text-slate-200">
                <span className="text-pink-400">Who</span> is it
                for?
              </h2>
            </div>
            <div className="ml-6 w-32 h-1 bg-gradient-to-r from-pink-500/50 to-transparent rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Who Is It For */}
            <div
              className="backdrop-blur-lg rounded-[20px] border border-green-500/30 bg-gradient-to-br from-green-500/10 via-slate-900/50 to-slate-900/50 p-8"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
                  <CheckCircle2 className="size-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Perfect For You If...
                </h3>
              </div>

              <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="size-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You're a couple or roommates
                    </p>
                    <p className="text-slate-400 text-sm">
                      Perfect for partners, spouses, or anyone
                      who regularly watches movies together
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="size-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You're tired of "What should we watch?"
                    </p>
                    <p className="text-slate-400 text-sm">
                      Eliminate the endless back-and-forth
                      discussions and find common ground
                      instantly
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="size-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You want a focused watchlist
                    </p>
                    <p className="text-slate-400 text-sm">
                      Only see movies you're both actually
                      interested in watching together
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="size-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You have different tastes
                    </p>
                    <p className="text-slate-400 text-sm">
                      Discover unexpected movies in the overlap
                      between your preferences
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <CheckCircle2 className="size-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You value your time
                    </p>
                    <p className="text-slate-400 text-sm">
                      Spend your evening watching movies, not
                      debating which one to pick
                    </p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Who It's Not For */}
            <div
              className="backdrop-blur-lg rounded-[20px] border border-slate-600/30 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-900/50 p-8"
              style={{
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="size-6 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M4.93 4.93l14.14 14.14" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white">
                  Not Quite Right If...
                </h3>
              </div>

              <ul className="space-y-4 mb-6">
                <li className="flex gap-3 items-start">
                  <div className="size-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="size-2 bg-slate-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You want to write detailed reviews
                    </p>
                    <p className="text-slate-400 text-sm">
                      DuoReel focuses on quick discovery, not
                      in-depth critique
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="size-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="size-2 bg-slate-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You need a comprehensive movie diary
                    </p>
                    <p className="text-slate-400 text-sm">
                      While you can mark movies as watched, it's
                      not our primary focus
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="size-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="size-2 bg-slate-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You want to read others' reviews
                    </p>
                    <p className="text-slate-400 text-sm">
                      We don't have a social/community review
                      system
                    </p>
                  </div>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="size-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="size-2 bg-slate-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-white font-semibold mb-1">
                      You mostly watch movies solo
                    </p>
                    <p className="text-slate-400 text-sm">
                      The magic happens when two people are
                      matching together
                    </p>
                  </div>
                </li>
              </ul>

              <div className="border-t border-slate-700/50 pt-6">
                <p className="text-slate-300 text-sm mb-3">
                  <span className="font-semibold text-white">
                    Looking for the features above?
                  </span>{" "}
                  Check out{" "}
                  <a
                    href="https://letterboxd.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-400 hover:text-orange-300 underline font-semibold transition-colors"
                  >
                    Letterboxd
                  </a>{" "}
                  – it's an amazing platform for tracking,
                  reviewing, and discovering films with a
                  passionate community.
                </p>
                <p className="text-slate-400 text-xs italic">
                  Pro tip: Use both! Import your Letterboxd
                  watchlist into DuoReel to find what to watch
                  together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Problem: Conversation Section */}
      <div className="py-20 bg-slate-950 relative overflow-hidden">
        {/* Movie Poster Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 grid grid-cols-8 gap-0 opacity-70"
            style={{
              transform:
                "perspective(1200px) rotateY(-15deg) rotateX(10deg) scale(1.4)",
              transformOrigin: "center center",
              minHeight: "120%",
            }}
          >
            {/* Row 1 */}
            <img
              src="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/npMcVR3ykKRtofGrf6rraNbwPTw.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iYypPT4bhqXTt1zOIC8FqEU2r4R.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 2 */}
            <img
              src="https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/xBKGJQsAIeweesB79KC89FpBrVr.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/cezWGskPY5x7GaglTTRN4Fugfb8.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lMyv7XAwXeJZXF9xw8JS9g3Iibb.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 3 */}
            <img
              src="https://image.tmdb.org/t/p/w500/aWeKITRFbbwY8txG5uCj4rMCfSR.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/dqK9Hag1054tghRQSqLSfrkvQnA.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef0kZjFOQ5.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lHu1wtNaczFPGFDTrjCSzeLPTKN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/db32LaOibwEliAmSL2jjDF6oDdj.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fev8UFNFFYsD5q7AcYS8LyTzqwl.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 4 */}
            <img
              src="https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fqe8v8ME0z0CiU7sf6vxToAfOCh.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/tVxDe01Zy3kZqaZRNiXFGDICdZk.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 5 */}
            <img
              src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ipc1O5rMpALxH1rJHnvvmpapo37.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89WW2Di64Ym.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/gzlJkVfWV5VEG5xK25cvFGJgkDz.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative">
          {/* Why DuoReel Section Title */}
          <div id="why-duoreel" className="mb-12 max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <h2 className="text-4xl font-bold text-slate-200">
                <span className="text-pink-400">Why</span> DuoReel?
              </h2>
            </div>
            <div className="ml-6 w-32 h-1 bg-gradient-to-r from-pink-500/50 to-transparent rounded-full"></div>
          </div>
          
          <div className="max-w-6xl mx-auto">
            <p className="text-slate-400 mb-16 text-lg">
              Without <span className="text-pink-400">Duo</span><span className="text-white">Reel</span>, every movie night starts the same way... 👇
            </p>

            {/* The Old Way - Without DuoReel */}
            <div className="mb-16">

            {/* Chat conversation */}
            <div className="space-y-4 max-w-2xl">
              {/* Girlfriend message - Left */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Want to watch a movie tonight? 🍿
                  </p>
                </div>
              </div>

              {/* Boyfriend message - Right */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Sure! How about Barbie?
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Girlfriend */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Already saw it twice! What about
                    Oppenheimer?
                  </p>
                </div>
              </div>

              {/* Boyfriend */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Babe, it's 3 hours long and I have work
                    tomorrow 😅
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Girlfriend */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Fair point... The Notebook?
                  </p>
                </div>
              </div>

              {/* Boyfriend */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    I've cried enough times to that movie 😭 How
                    about John Wick?
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Girlfriend */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Too violent for a Tuesday night... La La
                    Land?
                  </p>
                </div>
              </div>

              {/* Boyfriend */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    You know I don't do musicals 🙈 Inception?
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Girlfriend */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    I'm too tired to understand dreams within
                    dreams 🤯
                  </p>
                </div>
              </div>

              {/* Boyfriend */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Fast & Furious 10?
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Girlfriend */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    I haven't seen the first 9... What about
                    Titanic?
                  </p>
                </div>
              </div>

              {/* Boyfriend */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Spoiler alert: the ship sinks 🚢 And it's 3
                    hours again...
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Time passing indicator */}
              <div className="py-2 flex justify-center">
                <svg width="60" height="200" viewBox="0 0 60 200" className="opacity-50">
                  <path
                    d="M 30 10 Q 10 35, 30 60 Q 50 85, 30 110 Q 10 135, 30 160 Q 50 185, 30 190"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4,6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* 2 Hours Later Meme */}
              <div className="py-8 flex justify-center">
                <div className="relative">
                  <img 
                    src="https://i.ytimg.com/vi/fw7NJ4SWnW0/mqdefault.jpg"
                    alt="Two Hours Later"
                    className="max-w-md w-full object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Girlfriend */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Ugh this is impossible 😩
                  </p>
                </div>
              </div>

              {/* Boyfriend message - yawning */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    😴 *yawning* Did you pick it?
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Time passing indicator */}
              <div className="py-2 flex justify-center">
                <svg width="60" height="200" viewBox="0 0 60 200" className="opacity-50">
                  <path
                    d="M 30 10 Q 10 35, 30 60 Q 50 85, 30 110 Q 10 135, 30 160 Q 50 185, 30 190"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4,6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* End message */}
              <p className="text-slate-400 mb-8 text-lg text-center">
                ...and usually ends this way. 👇
              </p>

              {/* Cuddling cats image */}
              <div className="py-6 flex justify-center">
                <img 
                  src="https://www.publicdomainpictures.net/pictures/50000/nahled/cuddling-cats-13711468109O5.jpg"
                  alt="Cuddling cats"
                  className="max-w-xs w-full object-contain rounded-lg opacity-70"
                />
              </div>
            </div>
          </div>

            {/* Separator between Without and With sections */}
            <div className="py-12 flex justify-center">
              <div className="w-full max-w-md h-px bg-gradient-to-r from-transparent via-pink-500/50 to-transparent"></div>
            </div>

            {/* The New Way - With DuoReel */}
            <div>
              <div className="mb-8">
                <span className="text-slate-400 text-2xl">
                  ✅ With <span className="text-pink-400">Duo</span><span className="text-white">Reel</span>
                </span>
              </div>

              {/* Chat conversation */}
              <div className="space-y-4 max-w-2xl">
              {/* Girlfriend message - Left */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Want to watch a movie tonight? 🍿
                  </p>
                </div>
              </div>

              {/* Girlfriend message - Left */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Let's check our DuoReel! 🎬
                  </p>
                </div>
              </div>

              {/* Boyfriend message - Right */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Good idea! Opening it now...
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Match notification */}
              <div className="flex justify-center py-4">
                <div className="bg-gradient-to-r from-pink-500/30 to-purple-500/30 backdrop-blur-sm border border-pink-500/50 rounded-2xl px-6 py-4 shadow-lg shadow-pink-500/20">
                  <div className="flex items-center gap-3">
                    <Sparkles className="size-6 text-pink-400 animate-pulse" />
                    <div>
                      <div className="text-pink-400 font-semibold text-sm mb-1">
                        IT'S A MATCH! 💕
                      </div>
                      <div className="text-white font-bold">
                        The Grand Budapest Hotel
                      </div>
                      <div className="text-slate-300 text-xs">
                        You both saved this movie!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Girlfriend */}
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  S
                </div>
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Perfect! I've been wanting to watch that! 😍
                  </p>
                </div>
              </div>

              {/* Boyfriend */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-500/50 rounded-2xl rounded-tr-none px-4 py-3 max-w-[70%]">
                  <p className="text-white text-sm">
                    Same! Starting it now 🍿
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                  M
                </div>
              </div>

              {/* Time passing indicator */}
              <div className="py-2 flex justify-center">
                <svg width="60" height="200" viewBox="0 0 60 200" className="opacity-50">
                  <path
                    d="M 30 10 Q 10 35, 30 60 Q 50 85, 30 110 Q 10 135, 30 160 Q 50 185, 30 190"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4,6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Happy couple image */}
              <div className="py-6 flex justify-center">
                <img 
                  src="https://i.postimg.cc/6pn1tvbP/cats-tv.jpg"
                  alt="Cats watching TV"
                  className="max-w-xs w-full object-contain rounded-lg opacity-70"
                />
              </div>

              {/* Puuurrrfect message */}
              <div className="flex gap-3 items-center justify-center pt-4">
                <div className="bg-green-500/20 backdrop-blur-sm border border-green-500/50 rounded-2xl px-6 py-3">
                  <p className="text-green-400 text-center text-sm font-semibold">
                    😴 Puuurrrfect... Total time: 2 minutes! 😴
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Features List */}
      <div id="features" className="py-20 relative overflow-hidden">
        {/* Movie Poster Grid Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 grid grid-cols-8 gap-0 opacity-70"
            style={{
              transform:
                "perspective(1200px) rotateY(-15deg) rotateX(10deg) scale(1.4)",
              transformOrigin: "center center",
              minHeight: "120%",
            }}
          >
            {/* Row 1 */}
            <img
              src="https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/npMcVR3ykKRtofGrf6rraNbwPTw.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iYypPT4bhqXTt1zOIC8FqEU2r4R.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 2 */}
            <img
              src="https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/5VTN0pR8gcqV3EPUHHfMGnJYN9L.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/xBKGJQsAIeweesB79KC89FpBrVr.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/cezWGskPY5x7GaglTTRN4Fugfb8.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lMyv7XAwXeJZXF9xw8JS9g3Iibb.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 3 */}
            <img
              src="https://image.tmdb.org/t/p/w500/aWeKITRFbbwY8txG5uCj4rMCfSR.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/dqK9Hag1054tghRQSqLSfrkvQnA.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rSPw7tgCH9c6NqICZef0kZjFOQ5.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/lHu1wtNaczFPGFDTrjCSzeLPTKN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/db32LaOibwEliAmSL2jjDF6oDdj.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fev8UFNFFYsD5q7AcYS8LyTzqwl.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 4 */}
            <img
              src="https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/fqe8v8ME0z0CiU7sf6vxToAfOCh.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/pFlaoHTZeyNkG83vxsAJiGzfSsa.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/mDfJG3LC3Dqb67AZ52x3Z0jU0uB.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/tVxDe01Zy3kZqaZRNiXFGDICdZk.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />

            {/* Row 5 */}
            <img
              src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ipc1O5rMpALxH1rJHnvvmpapo37.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/8Y43POKjjKDGI9MH89WW2Di64Ym.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/gzlJkVfWV5VEG5xK25cvFGJgkDz.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
            <img
              src="https://image.tmdb.org/t/p/w500/ym1dxyOk4jFcSl4Q2zmRrA5BEEN.jpg"
              alt=""
              className="w-full h-auto brightness-75"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/70 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 relative">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Everything You Need
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start">
              <CheckCircle2 className="size-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  Infinite Movie Discovery
                </h4>
                <p className="text-slate-400">
                  Browse thousands of movies with infinite
                  scroll
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="size-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  Smart Filters
                </h4>
                <p className="text-slate-400">
                  Filter by genre, decade, and IMDb rating
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="size-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  Detailed Movie Info
                </h4>
                <p className="text-slate-400">
                  See ratings, cast, runtime, and full overviews
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="size-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  Hide Unwanted Movies
                </h4>
                <p className="text-slate-400">
                  Mark movies as "Not Interested" to hide them
                  forever
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Upload className="size-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  Import from Letterboxd
                </h4>
                <p className="text-slate-400">
                  Upload your watchlist CSV to auto-add to
                  Saved, or import watched movies to hide them
                  from Discover
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="size-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  Beautiful Design
                </h4>
                <p className="text-slate-400">
                  Modern, responsive interface that works on all
                  devices
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <CheckCircle2 className="size-6 text-green-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-semibold text-white mb-1">
                  100% Free
                </h4>
                <p className="text-slate-400">
                  All features available at no cost
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Find Your Perfect Movie?
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join couples who've already stopped arguing about
            what to watch
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-xl px-12 py-7 shadow-2xl shadow-blue-500/40"
          >
            Get Started Now
            <ArrowRight className="size-6 ml-2" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-slate-950/50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center gap-3">
            {/* TMDB Attribution */}
            <div className="flex items-center gap-2">
              <img 
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg"
                alt="TMDB"
                className="h-6 w-6"
              />
              <p className="text-slate-400 text-sm">
                This product uses the TMDB API but is not endorsed or certified by TMDB
              </p>
            </div>
            
            {/* Main Footer Text */}
            <p className="text-slate-500 text-sm">
              Made with ❤️ for movie lovers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}