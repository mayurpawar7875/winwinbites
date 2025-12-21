import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import logo from "@/assets/win-win-bites-logo.jpg";
import { InvoicesTab } from "@/components/sales/InvoicesTab";
import { ReceivablesTab } from "@/components/sales/ReceivablesTab";
import { CollectionsTab } from "@/components/sales/CollectionsTab";

export default function Sales() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container flex items-center h-12 sm:h-16 px-3 sm:px-4 gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={() => navigate("/plant-manager/dashboard")}
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3">
            <img src={logo} alt="Win Win Bites" className="h-6 sm:h-8 w-auto" />
            <div>
              <h1 className="font-bold text-sm sm:text-base text-foreground">Sales & Invoicing</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Manage invoices & collections</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-3 sm:px-4 py-3 sm:py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-3 sm:mb-4 h-8 sm:h-10">
            <TabsTrigger value="invoices" className="text-[10px] sm:text-sm">Invoices</TabsTrigger>
            <TabsTrigger value="receivables" className="text-[10px] sm:text-sm">Receivables</TabsTrigger>
            <TabsTrigger value="collections" className="text-[10px] sm:text-sm">Collections</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="mt-0">
            <InvoicesTab />
          </TabsContent>

          <TabsContent value="receivables" className="mt-0">
            <ReceivablesTab />
          </TabsContent>

          <TabsContent value="collections" className="mt-0">
            <CollectionsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
