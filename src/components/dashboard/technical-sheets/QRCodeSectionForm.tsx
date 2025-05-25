
"use client";

// import type { Control } from "react-hook-form";
// import { Controller } from "react-hook-form";
// import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";

interface QRCodeSectionFormProps {
  // control: Control<any>; // No direct form controls for now
  // errors: any;
}

export default function QRCodeSectionForm({}: QRCodeSectionFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>4. QR Code e Acesso Online</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>QR Code da Ficha (Será gerado automaticamente)</Label>
           <div className="mt-2 p-4 border rounded-md bg-muted/50 flex flex-col items-center justify-center">
            <Image src="https://placehold.co/150x150.png?text=QR+Code" alt="QR Code Placeholder" width={100} height={100} data-ai-hint="qr code" />
            <p className="text-xs text-muted-foreground mt-2">Funcionalidade em desenvolvimento.</p>
          </div>
          {/* <Controller name="qrCodeUrl" control={control} render={({ field }) => <Input {...field} disabled placeholder="Será gerado automaticamente" />} /> */}
        </div>
        <div>
          <Label>Texto de Acesso Online</Label>
           <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">Acesso aos projetos online</p>
          {/* <Controller name="textoAcessoOnline" control={control} render={({ field }) => <Input {...field} disabled />} /> */}
        </div>
        <div>
          <Label>Link da Ficha Técnica (Será gerado automaticamente)</Label>
           <p className="text-sm text-muted-foreground p-2 border rounded-md bg-muted">Funcionalidade em desenvolvimento.</p>
          {/* <Controller name="linkFichaPublica" control={control} render={({ field }) => <Input {...field} disabled placeholder="Será gerado automaticamente" />} /> */}
        </div>
      </CardContent>
    </Card>
  );
}

// Dummy Card components
const Card: React.FC<{className?: string, children: React.ReactNode}> = ({ className, children }) => <div className={cn("border rounded-lg shadow-sm bg-card text-card-foreground", className)}>{children}</div>;
const CardHeader: React.FC<{children: React.ReactNode}> = ({ children }) => <div className="p-6 flex flex-col space-y-1.5">{children}</div>;
const CardTitle: React.FC<{children: React.ReactNode}> = ({ children }) => <h3 className="text-2xl font-semibold leading-none tracking-tight">{children}</h3>;
const CardContent: React.FC<{className?: string, children: React.ReactNode}> = ({ className, children }) => <div className={cn("p-6 pt-0", className)}>{children}</div>;

// cn utility
function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(' ');
}
