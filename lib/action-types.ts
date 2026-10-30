// Action types
export type ArticleAction = {
  type: "article:fetch" | "article:fetch:success" | "article:fetch:error";
  payload?: any;
};

export type UserAction = {
  type: "user:login" | "user:login:success" | "user:login:error";
  payload?: any;
};