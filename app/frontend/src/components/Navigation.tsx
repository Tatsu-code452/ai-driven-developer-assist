import { NavLink } from "react-router-dom";

export const Navigation = () => {
    return (
        <aside
            style={{
                width: "240px",
                padding: "16px",
                borderRight: "1px solid #ddd",
            }}
        >
            <h3>Menu</h3>

            <nav>
                <ul>
                    <li>
                        <NavLink to="/">Dashboard</NavLink>
                    </li>

                    <li>
                        <NavLink to="/projects">プロジェクト管理</NavLink>
                    </li>

                    <li>
                        <NavLink to="/contexts">Context</NavLink>
                    </li>

                    <li>
                        <NavLink to="/workitems">WorkItem</NavLink>
                    </li>

                    <li>
                        <NavLink to="/artifacts">Artifact</NavLink>
                    </li>

                    <li>
                        <NavLink to="/traceability">Traceability</NavLink>
                    </li>

                    <li>
                        <NavLink to="/repositories">Repository</NavLink>
                    </li>
                </ul>
            </nav>
        </aside>
    );
};
