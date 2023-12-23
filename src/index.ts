import {
  Canister,
  Err,
  Ok,
  Opt,
  Principal,
  Record,
  Result,
  StableBTreeMap,
  Variant,
  Vec,
  query,
  text,
  update,
} from 'azle';

const TaskError = Variant({
  TaskDoesNotExist: Principal,
});

type TaskError = typeof TaskError.tsType;

const Task = Record({
  taskId: Principal,
  description: text,
  status: text,
});

type Task = typeof Task.tsType;

let taskList = StableBTreeMap<Principal, Task>(2);

export default Canister({
  addTask: update(
    [text, text],
    Result(Task, TaskError),
    (description, status) => {
      const taskId = generateId();
      const task: Task = {
        taskId,
        description,
        status,
      };
      taskList.insert(task.taskId, task);

      return Ok(task);
    },
  ),

  deleteTask: update([Principal], Result(Task, TaskError), (taskId) => {
    const taskOpt = taskList.get(taskId);

    if ('None' in taskOpt) {
      return Err({
        TaskDoesNotExist: taskId,
      });
    }

    const task = taskOpt.Some;

    taskList.remove(task.taskId);

    return Ok(task);
  }),

  getTaskList: query([], Vec(Task), () => {
    return taskList.values();
  }),

  getTaskDetails: query([Principal], Opt(Task), (taskId) => {
    return taskList.get(taskId);
  }),

  updateTaskStatus: update(
    [Principal, text],
    Result(Task, TaskError),
    (taskId, newStatus) => {
      const taskOpt = taskList.get(taskId);

      if ('None' in taskOpt) {
        return Err({
          TaskDoesNotExist: taskId,
        });
      }

      const task = taskOpt.Some;
      task.status = newStatus;

      taskList.insert(task.taskId, task);

      return Ok(task);
    },
  ),

  updateTaskDescription: update(
    [Principal, text],
    Result(Task, TaskError),
    (taskId, newDescription) => {
      const taskOpt = taskList.get(taskId);

      if ('None' in taskOpt) {
        return Err({
          TaskDoesNotExist: taskId,
        });
      }

      const task = taskOpt.Some;
      task.description = newDescription;

      taskList.insert(task.taskId, task);

      return Ok(task);
    },
  ),
});

function generateId(): Principal {
  const randomBytes = new Array(11)
    .fill(0)
    .map((_) => Math.floor(Math.random() * 256));

  return Principal.fromUint8Array(Uint8Array.from(randomBytes));
}
