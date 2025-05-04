import {BrowserRouter, Route, Routes, Outlet} from "react-router-dom"; // Import Outlet
import {Home} from "./pages/HomePage";
import {Navbar} from "./components/Navbar";
import {Login} from "./pages/LoginPage";
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {Dashboard} from "./components/Dashboard/DashboardMain";
import {RequireAuth} from "./components/Common/RequireAuth.tsx";
import {AccountSetting} from "./pages/Account/AccountSetting";
import {AccountCourses} from "./pages/Account/AccountCourses";
import {Register} from "./pages/RegisterPage";
import CourseCreate from "./pages/Course/CourseCreatePage";
import {EditorCourse} from "./pages/Course/CourseEditor";
import {SectionCreate} from "./pages/Course/SectionCreate";
import {CategoryPage} from "./pages/CategoryPage";
import {TestComponent} from "./components/Test";
import {EditSection} from "./pages/Course/SectionEdit";
import {EditTest} from "./components/Test/EditTest";
import {CoursePage} from "./pages/Course/CoursePage";
import {QuizTestPage} from "./pages/QuizTest";
import {AccountProgressPage} from "./pages/Account/AccountQuizProgress";

// Optional: Create a layout component for Account pages if needed
// const AccountLayout = () => (
//     <RequireAuth>
//         {/* Maybe add Account specific sidebar/nav here */}
//         <Outlet /> {/* Nested routes render here */}
//     </RequireAuth>
// );

export function App() {
    return (
        // Wrap the entire app in AuthProvider
        <BrowserRouter>
            <Navbar/>
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home/>}/>
                <Route path="/category" element={<CategoryPage/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/register" element={<Register/>}/>
                <Route path="/course/:id" element={<CoursePage/>}/> {/* Public course view? */}


                {/* Routes potentially requiring auth (depending on your logic) */}
                <Route path="/course">
                    {/* Public view might be /course/:id above */}
                    <Route path="create" element={<RequireAuth><CourseCreate/></RequireAuth>}/>
                    <Route path="edit/:id" element={<RequireAuth><EditorCourse/></RequireAuth>}/>
                    <Route path="section">
                        {/* Creating/editing sections/tests likely requires auth */}
                        <Route path=":id/create" element={<RequireAuth><SectionCreate/></RequireAuth>}/>
                        <Route path="edit/:id" element={<RequireAuth><EditSection/></RequireAuth>}/>
                        <Route path=":id/create_test" element={<RequireAuth><TestComponent/></RequireAuth>}/>
                        <Route path=":id/edit_test" element={<RequireAuth><EditTest/></RequireAuth>}/>
                        {/* Taking a test might require auth */}
                        <Route path=":sectionId/test" element={<RequireAuth><QuizTestPage/></RequireAuth>}/>
                    </Route>
                </Route>

                {/* Account routes - definitely require auth */}
                <Route path="/account" element={<RequireAuth><Outlet/></RequireAuth>}> {/* Wrap parent */}
                    <Route path="settings" element={<AccountSetting/>}/>
                    <Route path="courses" element={<AccountCourses/>}/>
                    <Route path="progress" element={<AccountProgressPage/>}/>
                    {/* Add index route if needed: <Route index element={<AccountDashboard />} /> */}
                </Route>

                {/* Admin Routes */}

                <Route path="/admin/dashboard" element={<RequireAuth><Dashboard/></RequireAuth>}/>

                {/* Optional: Add a 404 Not Found route */}
                {/* <Route path="*" element={<NotFoundPage />} /> */}
            </Routes>
            <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false}/>
        </BrowserRouter>
    );
}