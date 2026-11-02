import {
  Link
} from "react-router-dom";

type Props = {

  screenId: string;

  title: string;

};

export const PlaceholderPage = (
  props: Props
) => {

  return (

    <div
      className="
      space-y-4
      "
    >

      <div
        className="
        bg-white
        border
        rounded
        p-6
        "
      >

        <div
          className="
          text-xs
          text-slate-500
          "
        >
          {props.screenId}
        </div>

        <h1
          className="
          text-3xl
          font-bold
          "
        >
          {props.title}
        </h1>

      </div>

      <div
        className="
        grid
        grid-cols-3
        gap-4
        "
      >

        <div
          className="
          bg-white
          border
          rounded
          p-4
          "
        >
          情報
        </div>

        <div
          className="
          bg-white
          border
          rounded
          p-4
          "
        >
          一覧
        </div>

        <div
          className="
          bg-white
          border
          rounded
          p-4
          "
        >
          操作
        </div>

      </div>

      <div
        className="
        bg-white
        border
        rounded
        p-4
        "
      >

        <table
          className="
          w-full
          "
        >

          <thead>

          <tr>

            <th>ID</th>
            <th>名称</th>
            <th>状態</th>

          </tr>

          </thead>

          <tbody>

            <tr>
              <td>001</td>
              <td>サンプル</td>
              <td>TODO</td>
            </tr>

            <tr>
              <td>002</td>
              <td>サンプル</td>
              <td>DOING</td>
            </tr>

          </tbody>

        </table>

      </div>

      <div
        className="
        flex
        gap-2
        "
      >

        <button
          className="
          bg-blue-600
          text-white
          px-4
          py-2
          rounded
          "
        >
          新規作成
        </button>

        <button
          className="
          border
          px-4
          py-2
          rounded
          "
        >
          検索
        </button>

        <button
          className="
          border
          px-4
          py-2
          rounded
          "
        >
          更新
        </button>

      </div>

      <Link
        to="/dashboard"
      >
        ダッシュボードへ戻る
      </Link>

    </div>

  );

};
