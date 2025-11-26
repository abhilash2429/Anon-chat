import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background text-foreground selection:bg-foreground selection:text-background">
            <div className="max-w-2xl space-y-12">
                <div className="space-y-6">
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
                        ANON<span className="font-light">CHAT</span>
                    </h1>
                    <p className="text-xl md:text-2xl font-light text-muted-foreground leading-relaxed">
                        Ephemeral connections in a permanent world. <br />
                        No logs. No logins. Just now.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                    <Link href="/rooms/create" className="w-full sm:w-auto">
                        <Button size="lg" className="w-full sm:w-48 h-14 text-lg rounded-none border-2 border-foreground bg-foreground text-background hover:bg-background hover:text-foreground transition-all duration-300">
                            Start Room
                        </Button>
                    </Link>

                    <Link href="/rooms/join" className="w-full sm:w-auto">
                        <Button variant="outline" size="lg" className="w-full sm:w-48 h-14 text-lg rounded-none border-2 border-foreground hover:bg-foreground hover:text-background transition-all duration-300">
                            Join Room <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                    </Link>
                </div>

                <div className="pt-12 grid grid-cols-2 md:grid-cols-3 gap-8 text-sm text-muted-foreground font-mono border-t border-border">
                    <div>
                        <span className="block text-foreground font-bold mb-1">SECURE</span>
                        End-to-end encrypted video
                    </div>
                    <div>
                        <span className="block text-foreground font-bold mb-1">ANONYMOUS</span>
                        Auto-generated identities
                    </div>
                    <div className="col-span-2 md:col-span-1">
                        <span className="block text-foreground font-bold mb-1">OPEN</span>
                        Open source & free
                    </div>
                </div>
            </div>
        </main>
    );
}
