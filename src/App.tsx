import { Route, Routes, BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

import Layout from "@/components/Layout";
import Upload from "@/pages/Upload";
import UploadMaterials from "@/pages/UploadMaterials";
import Quiz from "@/pages/Quiz";
import Roadmap from "@/pages/Roadmap";
import Mastery from "@/pages/Mastery";
import NotFound from "@/pages/NotFound";
import Dashboard from "@/pages/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SonnerToaster position="bottom-right" />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload-materials" element={<UploadMaterials />} />
            <Route path="/upload-materials/:studyId" element={<UploadMaterials />} />
            <Route path="/quiz" element={<Quiz />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/mastery" element={<Mastery />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
