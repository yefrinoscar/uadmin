import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton() {
    const router = useRouter();
    return (
      <Button variant="outline" size="sm" className="w-fit" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>
    );
  }