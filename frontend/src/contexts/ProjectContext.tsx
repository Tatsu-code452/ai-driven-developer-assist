import {
    createContext,
    ReactNode,
    useContext,
    useMemo,
    useState,
} from "react";

import type {
    Project,
} from "../types/Api";

type ProjectContextValue = {
    project?: Project;
    setProject: (
        project?: Project,
    ) => void;
    clearProject: () => void;
};

const ProjectContext =
    createContext<ProjectContextValue>({
        setProject: () => {},
        clearProject: () => {},
    });

export const ProjectProvider = ({
    children,
}: {
    children: ReactNode;
}) => {

    const [
        project,
        setProjectState,
    ] = useState<Project>();

    const value = useMemo(
        () => ({
            project,

            setProject: (
                next?: Project,
            ) =>
                setProjectState(
                    next,
                ),

            clearProject: () =>
                setProjectState(
                    undefined,
                ),
        }),
        [project],
    );

    return (
        <ProjectContext.Provider
            value={value}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject =
    () =>
        useContext(
            ProjectContext,
        );
