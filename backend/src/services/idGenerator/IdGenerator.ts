type Entity = {
  id: string;
};

export const getNextId = (
  prefix: string,
  items: Entity[]
): string => {

  const maxNo =
    items
      .filter(
        item =>
          item.id.startsWith(
            prefix + "-"
          )
      )
      .map(
        item =>
          Number(
            item.id
              .replace(
                prefix + "-",
                ""
              )
          )
      )
      .filter(
        value =>
          !Number.isNaN(
            value
          )
      )
      .reduce(
        (
          current,
          value
        ) =>
          Math.max(
            current,
            value
          ),
        0
      );

  return (
    prefix +
    "-" +
    String(
      maxNo + 1
    ).padStart(
      3,
      "0"
    )
  );
};

export const createIdAllocator =
(
  prefix: string,
  items: Entity[]
) => {

  let current =
    Number(
      getNextId(
        prefix,
        items
      ).replace(
        prefix + "-",
        ""
      )
    );

  return () => {

    const value =
      prefix +
      "-" +
      String(
        current
      ).padStart(
        3,
        "0"
      );

    current++;

    return value;

  };

};
