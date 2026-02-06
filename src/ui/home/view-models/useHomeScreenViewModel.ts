import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { routes } from "../../../routing/Routes";

export type HomeScreenOutletContext = {
  rvtoolsOpenToken?: string;
};

export const useHomeScreenViewModel = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeTabKey = location.pathname.startsWith(routes.environments)
    ? 1
    : 0;

  const [isStartingPageModalOpen, setIsStartingPageModalOpen] = useState(false);
  const [rvtoolsOpenToken, setRvtoolsOpenToken] = useState(false);

  const breadcrumbs = [
    { key: 1, children: "Migration assessment" },
    {
      key: 2,
      children: activeTabKey === 1 ? "environments" : "assessments",
      isActive: true,
    },
  ];

  const handleTabClick = (
    _event: React.MouseEvent<HTMLElement> | React.KeyboardEvent | MouseEvent,
    tabIndex: string | number,
  ): void => {
    const index = typeof tabIndex === "number" ? tabIndex : Number(tabIndex);
    navigate(index === 1 ? routes.environments : routes.assessments);
  };

  const handleOpenStartingPageModal = () => setIsStartingPageModalOpen(true);
  const handleCloseStartingPageModal = () => setIsStartingPageModalOpen(false);
  const handleOpenRVToolsModal = () => {
    setRvtoolsOpenToken(true);
    navigate(routes.assessments); // switch to assessments tab
  };

  return {
    activeTabKey,
    breadcrumbs,
    isStartingPageModalOpen,
    rvtoolsOpenToken,
    handleTabClick,
    handleOpenStartingPageModal,
    handleCloseStartingPageModal,
    handleOpenRVToolsModal,
  };
};
