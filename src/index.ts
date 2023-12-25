import {
  Record,
  StableBTreeMap,
  Vec,
  ic,
  $query,
  $update,
  Result,
  nat64,
  Opt,
  match,
  Variant,
} from "azle";
import { v4 as uuidv4, validate as validateUUID } from "uuid";

// Define the structure of a task
type TaskError = Variant<{
  TaskDoesNotExist: string;
  InvalidTaskId: string;
}>;

type Task = Record<{
  taskId: string;
  description: string;
  status: string;
}>;

type TaskPayload = Record<{
  description: string;
  status: string;
}>;

// Create a stable B-tree map to store tasks
const Tasks = new StableBTreeMap<string, Task>(0, 44, 1024);

// Function to validate UUID format
function isValidUUID(id: string): boolean {
  return validateUUID(id);
}

$update
export function addTask(payload: TaskPayload): Result<Task, string> {
  try {
    // Payload Validation: Ensure that required fields are present in the payload
    if (!payload.description || !payload.status) {
      return Result.Err<Task, string>("Invalid payload");
    }

    const taskId = uuidv4();
    const newTask: Task = {
      taskId,
      description: payload.description,
      status: payload.status,
    };

    // Insert the new task into the task list
    Tasks.insert(newTask.taskId, newTask);

    return Result.Ok(newTask);
  } catch (error) {
    return Result.Err<Task, string>(`Failed to add task: ${error}`);
  }
}

$update
export function deleteTask(taskId: string): Result<Task, string> {
  try {
    // ID Validation: Ensure that the provided ID is a valid UUID
    if (!isValidUUID(taskId)) {
      return Result.Err<Task, string>("Invalid Task ID format");
    }

    return match(Tasks.get(taskId), {
      Some: (task) => {
        Tasks.remove(task.taskId);
        return Result.Ok<Task, string>(task);
      },
      None: () => Result.Err<Task, string>(`Task with ID=${taskId} not found`),
    });
  } catch (error) {
    return Result.Err<Task, string>(`An error occurred while deleting task. Error: ${error}`);
  }
}

$query
export function getTaskList(): Result<Vec<Task>, string> {
  try {
    const tasks = Tasks.values();
    return Result.Ok(tasks);
  } catch (error) {
    return Result.Err<Vec<Task>, string>(`Failed to retrieve task list: ${error}`);
  }
}

$query
export function getTaskDetails(taskId: string): Result<Task, string> {
  try {
    // ID Validation: Ensure that the provided ID is a valid UUID
    if (!isValidUUID(taskId)) {
      return Result.Err<Task, string>("Invalid Task ID format");
    }

    return match(Tasks.get(taskId), {
      Some: (task) => Result.Ok<Task, string>(task),
      None: () => Result.Err<Task, string>(`Task not found with ID: ${taskId}`),
    });
  } catch (error) {
    return Result.Err<Task, string>(`An error occurred while retrieving task details. Error: ${error}`);
  }
}

$update
export function updateTaskStatus(taskId: string, newStatus: string): Result<Task, TaskError> {
  try {
    // ID Validation: Ensure that the provided ID is a valid UUID
    if (!isValidUUID(taskId)) {
      return Result.Err<Task, TaskError>({ InvalidTaskId: "Invalid Task ID format" });
    }

    return match(Tasks.get(taskId), {
      Some: (task) => {
        task.status = newStatus;
        Tasks.insert(task.taskId, task);
        return Result.Ok<Task, TaskError>(task);
      },
      None: () => Result.Err<Task, TaskError>({ TaskDoesNotExist: `Task with ID=${taskId} not found` }),
    });
  } catch (error) {
  return Result.Err<Task, TaskError>({TaskDoesNotExist: `Task with ID=${taskId} not found` });
  }
}

$update
export function updateTaskDescription(taskId: string, newDescription: string): Result<Task, TaskError> {
  try {
    // ID Validation: Ensure that the provided ID is a valid UUID
    if (!isValidUUID(taskId)) {
      return Result.Err<Task, TaskError>({ InvalidTaskId: "Invalid Task ID format" });
    }

    return match(Tasks.get(taskId), {
      Some: (task) => {
        task.description = newDescription;
        Tasks.insert(task.taskId, task);
        return Result.Ok<Task, TaskError>(task);
      },
      None: () => Result.Err<Task, TaskError>({ TaskDoesNotExist: `Task with ID=${taskId} not found` }),
    });
  } catch (error) {
    return Result.Err<Task, TaskError>({TaskDoesNotExist: `Task with ID=${taskId} not found` });
  }
}

// Cryptographic utility for generating random values
globalThis.crypto = {
  // @ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  },
};
