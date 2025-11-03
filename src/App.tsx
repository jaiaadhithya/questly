import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Upload from "./pages/Upload";
import UploadMaterials from "./pages/UploadMaterials";
import Quiz from "./pages/Quiz";
import Roadmap from "./pages/Roadmap";
import Mastery from "./pages/Mastery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/upload-materials" element={<UploadMaterials />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/mastery" element={<Mastery />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
