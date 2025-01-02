const Task = require("../models/Task.js");

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskList = await Task.findOne({ userId });

    if (!taskList) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalTasks: 0,
            tasksCompleted: 0,
            tasksPending: 0,
            averageTimePerCompletedTask: 0,
          },
          pendingSummary: {
            pendingTasks: 0,
            totalTimeLapsed: 0,
            totalTimeToFinish: 0,
          },
          priorityWiseData: [
            { priority: 1, pendingTasks: 0, timeLapsed: 0, timeToFinish: 0 },
            { priority: 2, pendingTasks: 0, timeLapsed: 0, timeToFinish: 0 },
            { priority: 3, pendingTasks: 0, timeLapsed: 0, timeToFinish: 0 },
            { priority: 4, pendingTasks: 0, timeLapsed: 0, timeToFinish: 0 },
            { priority: 5, pendingTasks: 0, timeLapsed: 0, timeToFinish: 0 },
          ],
        },
      });
    }

    const tasks = taskList.taskLists;
    const now = new Date();

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((task) => task.status === "Finished");
    const pendingTasks = tasks.filter((task) => task.status === "Pending");
    const tasksCompleted = (completedTasks.length / totalTasks) * 100;
    const tasksPending = (pendingTasks.length / totalTasks) * 100;
    const averageTimePerCompletedTask =
      completedTasks.length > 0
        ? completedTasks.reduce((acc, task) => acc + task.timeToFinish, 0) /
          completedTasks.length
        : 0;

    const timeLapsedForPendingTasks = pendingTasks.reduce((acc, task) => {
      const startTime = new Date(task.startTime);
      const timeLapsed = Math.max(0, (now - startTime) / (1000 * 60 * 60));
      return acc + timeLapsed;
    }, 0);

    const timeToFinishPendingTasks = pendingTasks.reduce((acc, task) => {
      const endTime = new Date(task.endTime);
      const timeRemaining = Math.max(0, (endTime - now) / (1000 * 60 * 60));
      return acc + timeRemaining;
    }, 0);

    const priorityWiseData = Array.from({ length: 5 }, (_, index) => {
      const priority = index + 1;
      const priorityTasks = pendingTasks.filter(
        (task) => task.priority === priority
      );

      const timeLapsed = priorityTasks.reduce((acc, task) => {
        const startTime = new Date(task.startTime);
        return acc + Math.max(0, (now - startTime) / (1000 * 60 * 60));
      }, 0);

      const timeToFinish = priorityTasks.reduce((acc, task) => {
        const endTime = new Date(task.endTime);
        return acc + Math.max(0, (endTime - now) / (1000 * 60 * 60));
      }, 0);

      return {
        priority,
        pendingTasks: priorityTasks.length,
        timeLapsed: Math.round(timeLapsed),
        timeToFinish: Math.round(timeToFinish),
      };
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalTasks,
          tasksCompleted: Math.round(tasksCompleted),
          tasksPending: Math.round(tasksPending),
          averageTimePerCompletedTask: averageTimePerCompletedTask.toFixed(1),
        },
        pendingSummary: {
          pendingTasks: pendingTasks.length,
          totalTimeLapsed: Math.round(timeLapsedForPendingTasks),
          totalTimeToFinish: Math.round(timeToFinishPendingTasks),
        },
        priorityWiseData,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching dashboard data",
    });
  }
};

const validateTaskInput = (task) => {
  const errors = [];

  if (!task.title || typeof task.title !== "string") {
    errors.push("Title must be a non-empty string");
  }

  if (
    !Number.isInteger(task.priority) ||
    task.priority < 1 ||
    task.priority > 5
  ) {
    errors.push("Priority must be an integer between 1 and 5");
  }

  if (!["Pending", "Finished"].includes(task.status)) {
    errors.push('Status must be either "Pending" or "Finished"');
  }

  const startDate = new Date(task.startTime);
  const endDate = new Date(task.endTime);

  if (isNaN(startDate.getTime())) {
    errors.push("Invalid start time format");
  }

  if (isNaN(endDate.getTime())) {
    errors.push("Invalid end time format");
  }

  if (startDate >= endDate) {
    errors.push("End time must be after start time");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

exports.createTask = async (req, res) => {
  try {
    const { title, priority, status, startTime, endTime } = req.body;
    const userId = req.user?.userId;
    const taskValidation = validateTaskInput({
      title,
      priority,
      status,
      startTime,
      endTime,
    });

    if (!taskValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: taskValidation.errors,
      });
    }

    const timeToFinish =
      (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);

    const existingTaskList = await Task.findOne({ userId });
    const nextId = existingTaskList
      ? (existingTaskList.taskLists.length + 1).toString()
      : "1";
    const newTask = {
      id: nextId,
      title,
      priority,
      status,
      startTime,
      endTime,
      timeToFinish: Number(timeToFinish.toFixed(2)),
    };

    let result;

    if (existingTaskList) {
      result = await Task.findOneAndUpdate(
        { userId },
        { $push: { taskLists: newTask } },
        { new: true }
      );
    } else {
      result = await Task.create({
        userId,
        taskLists: [newTask],
      });
    }

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: {
        taskLists: result.taskLists,
      },
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while creating task",
    });
  }
};

exports.getAllTasks = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taskList = await Task.findOne({ userId });

    if (!taskList) {
      return res.status(200).json({
        success: true,
        data: {
          taskLists: [],
          totalTimeToFinish: 0,
          totalTasks: 0,
        },
      });
    }

    const totalTimeToFinish = taskList.taskLists.reduce(
      (total, task) => total + task.timeToFinish,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        taskLists: taskList.taskLists,
        totalTimeToFinish: Number(totalTimeToFinish.toFixed(2)),
        totalTasks: taskList.taskLists.length,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while fetching tasks",
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { id } = req.params;
    let taskId = id;
    const result = await Task.findOneAndUpdate(
      { userId },
      {
        $pull: { taskLists: { id: taskId } },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Task not found or user not authorized",
      });
    }

    const updatedTaskLists = result.taskLists.map((task, index) => ({
      ...task,
      id: (index + 1).toString(),
    }));

    const finalResult = await Task.findOneAndUpdate(
      { userId },
      { $set: { taskLists: updatedTaskLists } },
      { new: true }
    );

    const totalTimeToFinish = finalResult.taskLists.reduce(
      (total, task) => total + task.timeToFinish,
      0
    );
    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
      data: {
        taskLists: finalResult.taskLists,
        totalTimeToFinish: Number(totalTimeToFinish.toFixed(2)),
        totalTasks: finalResult.taskLists.length,
      },
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while deleting task",
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const userId = req.user.userId;
    let { id } = req.params;
    let taskId = id;
    const { title, priority, status, startTime, endTime } = req.body;

    const taskValidation = validateTaskInput({
      title,
      priority,
      status,
      startTime,
      endTime,
    });

    if (!taskValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: taskValidation.errors,
      });
    }

    const timeToFinish =
      (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60);

    const result = await Task.findOneAndUpdate(
      {
        userId,
        "taskLists.id": taskId,
      },
      {
        $set: {
          "taskLists.$.title": title,
          "taskLists.$.priority": priority,
          "taskLists.$.status": status,
          "taskLists.$.startTime": startTime,
          "taskLists.$.endTime": endTime,
          "taskLists.$.timeToFinish": Number(timeToFinish.toFixed(2)),
        },
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Task not found or user not authorized",
      });
    }

    const totalTimeToFinish = result.taskLists.reduce(
      (total, task) => total + task.timeToFinish,
      0
    );

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: {
        taskLists: result.taskLists,
        totalTimeToFinish: Number(totalTimeToFinish.toFixed(2)),
        totalTasks: result.taskLists.length,
      },
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      success: false,
      message: "Server error occurred while updating task",
    });
  }
};
