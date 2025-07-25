import { createContext, useContext } from "react";

export const TaskEventsContext = createContext<{ onTaskCreated: () => void }>({ onTaskCreated: () => {} });
export const useTaskEvents = () => useContext(TaskEventsContext); 