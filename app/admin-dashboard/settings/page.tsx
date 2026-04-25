"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, ShieldAlert, Globe, Users, Bell } from "lucide-react";

const DEFAULT_CONFIG = {
    siteName: "Tana Maaro Live Ecosystem",
    supportEmail: "support@tanamaaro.com",
    maintenanceMode: false,
    openRegistration: true,
    requireEmailVerification: false,
    allowAnonymousViewing: true,
    notifyOnNewPosts: true,
    maxPostLength: "500",
};

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");
    const [config, setConfig] = useState(DEFAULT_CONFIG);

    useEffect(() => {
        fetch("/api/admin/settings")
            .then(r => r.json())
            .then(data => {
                if (data && !data.error) {
                    setConfig({ ...DEFAULT_CONFIG, ...data });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const handleToggle = (key: keyof typeof config) => {
        setConfig(prev => ({ ...prev, [key]: !prev[key] }));
        setSaved(false);
    };

    const handleChange = (key: keyof typeof config, value: string) => {
        setConfig(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        try {
            const res = await fetch("/api/admin/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(config),
            });
            if (!res.ok) {
                const data = await res.json();
                setError(data.error || "Failed to save settings.");
            } else {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch {
            setError("Network error. Try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-gray-400 animate-pulse">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                        <Settings className="text-gray-400" />
                        System Configurations
                    </h1>
                    <p className="text-gray-400 mt-1">Global platform overrides and behavior defaults.</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className={`transition-all duration-300 font-bold ${saved ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                    >
                        {saving ? (
                            <span className="animate-pulse">Saving...</span>
                        ) : saved ? (
                            <><Save className="w-4 h-4 mr-2" /> Saved!</>
                        ) : (
                            <><Save className="w-4 h-4 mr-2" /> Commit Changes</>
                        )}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* GENERAL PLATFORM */}
                <Card className="bg-neutral-950 border border-white/5 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                            <Globe className="text-blue-500" />
                            General Platform
                        </CardTitle>
                        <CardDescription>Base identification attributes.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="uppercase text-xs font-bold tracking-widest text-gray-400">Platform Name</Label>
                            <Input
                                value={config.siteName}
                                onChange={(e) => handleChange("siteName", e.target.value)}
                                className="bg-black border-white/10 text-white font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="uppercase text-xs font-bold tracking-widest text-gray-400">Support Email</Label>
                            <Input
                                value={config.supportEmail}
                                onChange={(e) => handleChange("supportEmail", e.target.value)}
                                className="bg-black border-white/10 text-white font-medium"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* SECURITY OVERRIDES */}
                <Card className="bg-neutral-950 border border-white/5 shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full" />
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-red-500">
                            <ShieldAlert className="text-red-600" />
                            Security Directives
                        </CardTitle>
                        <CardDescription>High-risk global locking mechanisms.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-red-900/30 bg-red-950/10">
                            <div className="space-y-0.5">
                                <Label className="text-base text-white font-bold">Maintenance Lockout</Label>
                                <p className="text-xs text-red-400">Non-admins are disconnected from routing.</p>
                            </div>
                            <Switch
                                checked={config.maintenanceMode}
                                onCheckedChange={() => handleToggle("maintenanceMode")}
                            />
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-white/10 bg-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-base text-gray-200 font-bold">Open Registration</Label>
                                <p className="text-xs text-gray-400">Allow new users to create accounts.</p>
                            </div>
                            <Switch
                                checked={config.openRegistration}
                                onCheckedChange={() => handleToggle("openRegistration")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* USER CONFIGURATION */}
                <Card className="bg-neutral-950 border border-white/5 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                            <Users className="text-green-500" />
                            Audience Ruleset
                        </CardTitle>
                        <CardDescription>Define how users interact natively.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-gray-200 font-bold">Anonymous Spectating</Label>
                                <p className="text-xs text-gray-400">Allow unauthenticated guests to read posts.</p>
                            </div>
                            <Switch
                                checked={config.allowAnonymousViewing}
                                onCheckedChange={() => handleToggle("allowAnonymousViewing")}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-base text-gray-200 font-bold">Mandatory Email Verification</Label>
                                <p className="text-xs text-gray-400">Lock write-access until email is confirmed.</p>
                            </div>
                            <Switch
                                checked={config.requireEmailVerification}
                                onCheckedChange={() => handleToggle("requireEmailVerification")}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* CONTENT CONFIGURATION */}
                <Card className="bg-neutral-950 border border-white/5 shadow-xl">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg uppercase tracking-widest text-white">
                            <Bell className="text-purple-500" />
                            Content Thresholds
                        </CardTitle>
                        <CardDescription>Rules defining payload limits.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="uppercase text-xs font-bold tracking-widest text-gray-400">Max Roast Length (Characters)</Label>
                            <Input
                                type="number"
                                value={config.maxPostLength}
                                onChange={(e) => handleChange("maxPostLength", e.target.value)}
                                className="bg-black border-white/10 text-white font-medium"
                            />
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-white/5">
                            <div className="space-y-0.5">
                                <Label className="text-base text-gray-200 font-bold">Internal Admin Alerts</Label>
                                <p className="text-xs text-gray-400">Ping admin on volatile content drops.</p>
                            </div>
                            <Switch
                                checked={config.notifyOnNewPosts}
                                onCheckedChange={() => handleToggle("notifyOnNewPosts")}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
