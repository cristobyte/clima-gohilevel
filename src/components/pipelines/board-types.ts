export type BoardCard = {
  id: string;
  name: string;
  value: number;
  contactName: string;
  assignee: string | null;
  status: string;
};

export type BoardStage = {
  id: string;
  name: string;
  color: string | null;
};
