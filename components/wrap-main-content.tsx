"use client"

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WrapContent({
    children,
    title,
    subtitle
}: {
    children: React.ReactNode;
    title: string,
    subtitle: string
}) {
    const router = useRouter()

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 h-10 mb-16">
                <SidebarTrigger />
                <Separator orientation="vertical" className="!h-6" />
                <h1 className="text-xl font-semibold">{title}</h1>
            </div>

            <div className="flex gap-5">
                <Button variant="outline" className="justify-center items-center" onClick={() => router.back()} >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                </Button>
                <h2 className="text-2xl font-bold tracking-tight">{subtitle}</h2>
            </div>

            <>
                {children}
            </>
        </div>
    );
}
