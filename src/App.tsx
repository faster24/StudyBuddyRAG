import { lazy, Suspense, type ReactNode } from "react";
import { Routes, Route, Navigate} from "react-router-dom";
import {ThemeProvider} from "@/components/ThemeProvider.tsx";
import MainLayout from "@/components/MainLayout";
import Login from "@/pages/Login.tsx";
import Register from "@/pages/Register.tsx";
import ProtectedRoute from "@/components/ProtectedRoute.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import GenerateQuestion from "@/pages/GenerateQuestion.tsx";
import Documents from "@/pages/Documents.tsx";
import MyQuizzes from "./pages/MyQuizzes";
import Settings from "./pages/Settings";
import {Toaster} from "@/components/ui/sonner.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

// Pages that render Markdown/LaTeX load the markdown + KaTeX bundle on demand
const ChatAgent = lazy(() => import("@/pages/ChatAgent.tsx"));
const FlashcardPage = lazy(() => import("@/pages/Flashcard.tsx"));
const QuizTake = lazy(() => import("@/pages/QuizTake.tsx"));

const withSuspense = (page: ReactNode) => (
    <Suspense fallback={<div className="flex justify-center py-12"><Spinner className="h-6 w-6"/></div>}>
        {page}
    </Suspense>
);


export default function App() {
    return (
        <ThemeProvider>
            <Routes>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>

                <Route element={<ProtectedRoute/>}>
                    <Route element={<MainLayout/>}>
                        <Route path="/" element={<Navigate to="/dashboard" replace/>}/>
                        <Route path="/dashboard" element={<Dashboard/>}/>
                        <Route path="/generate-questions" element={<GenerateQuestion/>}/>
                        <Route path="/flashcards" element={withSuspense(<FlashcardPage/>)}/>
                        <Route path="/knowledge-base" element={<Documents/>}/>
                        <Route path="/chat" element={withSuspense(<ChatAgent/>)}/>
                        <Route path="/my-quizzes" element={<MyQuizzes/>}/>
                        <Route path="/my-quizzes/:quizId" element={withSuspense(<QuizTake/>)}/>
                        <Route path="/settings" element={<Settings/>}/>
                    </Route>
                </Route>
                <Route path="*" element={<Navigate to="/" replace/>}/>
            </Routes>
            <Toaster richColors position="top-right"/>
        </ThemeProvider>
    );
}
