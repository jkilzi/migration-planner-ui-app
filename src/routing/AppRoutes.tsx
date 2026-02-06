import { InvalidObject } from "@redhat-cloud-services/frontend-components/InvalidObject";
import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AssessmentsScreen } from "../ui/assessment/views/AssessmentsScreen";
import { Environment } from "../ui/environment/views/Environment";
import { HomeScreen } from "../ui/home/views/HomeScreen";

const Report = lazy(
  () => import(/* webpackChunkName: "Report" */ "../ui/report/views/Report"),
);

const ExampleReport = lazy(
  () =>
    import(
      /* webpackChunkName: "ExampleReport" */ "../ui/report/views/ExampleReport"
    ),
);

const CreateFromOva = lazy(
  () =>
    import(
      /* webpackChunkName: "CreateFromOva" */ "../ui/assessment/views/CreateFromOva"
    ),
);

const AssessmentDetails = lazy(
  () =>
    import(
      /* webpackChunkName: "AssessmentDetails" */ "../ui/assessment/views/AssessmentDetails"
    ),
);

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route index element={<Navigate to="assessments" replace />} />

    {/* Pathless layout route — HomeScreen renders the shell + <Outlet /> */}
    <Route element={<HomeScreen />} errorElement={<InvalidObject />}>
      <Route path="assessments" element={<AssessmentsScreen />} />
      <Route path="environments" element={<Environment />} />
    </Route>

    {/* Independent routes — they have their own page layout */}
    <Route path="assessments/:id/report" element={<Report />} />
    <Route path="assessments/example-report" element={<ExampleReport />} />
    <Route path="assessments/create" element={<CreateFromOva />} />
    <Route path="assessments/:id" element={<AssessmentDetails />} />

    <Route path="*" element={<InvalidObject />} />
  </Routes>
);
