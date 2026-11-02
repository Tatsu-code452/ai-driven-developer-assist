import { useLocation } from "react-router-dom";

type Props = {
  screenId: string;
  title: string;
};

export const PlaceholderPage = (
  props: Props
) => {

  const location =
    useLocation();

  return (

    <div
      className="
      bg-white
      rounded
      border
      p-8
      "
    >

      <div
        className="
        text-sm
        text-slate-500
        "
      >
        {props.screenId}
      </div>

      <h1
        className="
        text-3xl
        font-bold
        mt-2
        "
      >
        {props.title}
      </h1>

      <div
        className="
        mt-6
        text-slate-600
        "
      >
        Route :
        {location.pathname}
      </div>

      <div
        className="
        mt-8
        border-t
        pt-6
        "
      >
        TODO
      </div>

    </div>

  );

};
