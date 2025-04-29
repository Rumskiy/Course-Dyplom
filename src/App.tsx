import {BrowserRouter, Route, Routes} from "react-router";
import {Home} from "./pages/HomePage";
import {Navbar} from "./components/Navbar";
import {Login} from "./pages/LoginPage";
import {ToastContainer} from "react-toastify";
import 'react-toastify/dist/ReactToastify.css'
import {Dashboard} from "./components/Dashboard/DashboardMain";
import {RequireAuth} from "./components/Common/RequireAuth.tsx";
import {AccountSetting} from "./pages/AccountSetting";
import {AccountCourses} from "./pages/AccountCourses";
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
import {AccountProgressPage} from "./pages/AccountQuizProgress";


export function App() {

    return (
        <>
            <BrowserRouter>
                <Navbar/>
                <Routes>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/category" element={<CategoryPage/>}/>

                    <Route path="/course">
                        <Route path="create" element={<CourseCreate/>}/>
                        <Route path="edit/:id" element={<EditorCourse/>}/>
                        <Route path=":id" element={<CoursePage/>}/>
                        <Route path="section">
                            <Route path=":id/create" element={<SectionCreate/>}/>
                            <Route path="edit/:id" element={<EditSection/>}/>
                            <Route path={":id/create_test"} element={<TestComponent/>}/>
                            <Route path=":id/edit_test" element={<EditTest/>}/>
                            <Route path=":sectionId/test" element={<QuizTestPage />} />
                        </Route>
                    </Route>

                    <Route path="/login" element={<Login/>}/>
                    <Route path="/register" element={<Register/>}/>
                    <Route path="/account">
                        <Route path="settings" element={<AccountSetting/>}/>
                        <Route path="courses" element={<AccountCourses/>}/>
                        <Route path="progress" element={<AccountProgressPage/>}/>
                    </Route>
                    <Route path="/admin/dashboard" element={<RequireAuth><Dashboard/></RequireAuth>}/>
                </Routes>
                <ToastContainer position="top-center"/>
            </BrowserRouter>
        </>
    )
}