import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import custodianServices from "@/services/custodianServices";
import { setStorageItem } from "@/utils/storageUtils";
import { toast } from "sonner";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await custodianServices.custodianLogin({
        usernameOrEmail:email,
        password:password,
      });
      if (res?.data) {
        setStorageItem("access", res.data.accessToken);
        if (res.data) {
          setStorageItem("refresh", res.data.refreshToken);
        }
        if (res.data?.custodian?._id) {
          setStorageItem("userId", String(res.data?.custodian?._id));
        }
        if (res.data?.custodian) {
          setStorageItem("user", JSON.stringify(res.data?.custodian));
        }

        navigate("/dashboard");
      } else {
        toast.error(res?.error || "Login failed. Please try again.",{position:"top-right"});
      }
    } catch {
      toast.error("Login failed. Please try again.",{position:"top-right"});
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background grid effect */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(hsl(157 100% 50% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(157 100% 50% / 0.3) 1px, transparent 1px)`,
        backgroundSize: '60px 60px'
      }} />

      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass-card-glow mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            WhiteBox <span className="neon-text">Custodian Access</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Multi-signature protected administrative access
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground text-sm">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@whitebox.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-muted-foreground text-sm">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-muted/50 border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-red-500 text-center">{error}</p>
              )}

              <button
                type="submit"
                className="glow-button w-full rounded-lg text-sm disabled:opacity-70"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Multi-signature protected administrative access.
        </p>
      </div>
    </div>
  );
};

export default Login;
