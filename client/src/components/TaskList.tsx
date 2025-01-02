import React, { useState, useEffect, useRef } from "react";
import { Pencil, Loader } from "lucide-react";

type Task = {
  id: string;
  title: string;
  priority: number;
  status: "Pending" | "Finished";
  startTime: string;
  endTime: string;
  timeToFinish: number;
};

const BACKEND_URL = process.env.REACT_APP_SERVER_URL;

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState(1);
  const [status, setStatus] = useState<"Pending" | "Finished">("Pending");
  const [startTime, setStartTime] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
  const [priorityFilter, setPriorityFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<
    "Pending" | "Finished" | null
  >(null);

  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSortDropdownOpen(false);
      }
      if (
        priorityDropdownRef.current &&
        !priorityDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPriorityDropdownOpen(false);
      }
      if (
        statusDropdownRef.current &&
        !statusDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStatusDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch(`${BACKEND_URL}api/tasks/lists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data.data.taskLists);
    } catch (err) {
      setError("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [refreshTrigger]);

  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks];

    if (priorityFilter !== null) {
      filteredTasks = filteredTasks.filter(
        (task) => task.priority === priorityFilter
      );
    }

    if (statusFilter !== null) {
      filteredTasks = filteredTasks.filter(
        (task) => task.status === statusFilter
      );
    }

    if (sortField) {
      filteredTasks.sort((a, b) => {
        let compareA = a[sortField as keyof Task];
        let compareB = b[sortField as keyof Task];

        if (sortField === "startTime" || sortField === "endTime") {
          compareA = new Date(compareA as string).getTime();
          compareB = new Date(compareB as string).getTime();
        }

        if (compareA < compareB) return sortOrder === "ASC" ? -1 : 1;
        if (compareA > compareB) return sortOrder === "ASC" ? 1 : -1;
        return 0;
      });
    }

    return filteredTasks;
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((current) => (current === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortOrder("ASC");
    }
    setIsSortDropdownOpen(false);
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const url = editingTask
        ? `${BACKEND_URL}api/tasks/update/${editingTask.id}`
        : `${BACKEND_URL}api/tasks/create`;
      const method = editingTask ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          priority,
          status,
          startTime,
          endTime,
        }),
      });

      setRefreshTrigger((prev) => prev + 1);
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.log(err);
      setError(editingTask ? "Failed to update task" : "Failed to create task");
    }
  };

  const handleDeleteSelected = async () => {
    try {
      const token = localStorage.getItem("token");

      await Promise.all(
        selectedTasks.map((id) =>
          fetch(`${BACKEND_URL}api/tasks/delete/${id}`, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
        )
      );

      setRefreshTrigger((prev) => prev + 1);
      setSelectedTasks([]);
    } catch (err) {
      setError("Failed to delete tasks");
    }
  };

  const resetForm = () => {
    setTitle("");
    setPriority(1);
    setStatus("Pending");
    setStartTime(new Date().toISOString().slice(0, 16));
    setEndTime(
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    );
    setEditingTask(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-6 w-6 text-blue-600" />
      </div>
    );
  }

  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 bg-white border-b z-10 px-4 py-3 sm:px-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
          Task list
        </h1>
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div className="grid grid-cols-2 sm:flex gap-2">
            <button
              onClick={openAddModal}
              className="px-4 py-2 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 text-sm sm:text-base"
            >
              + Add task
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedTasks.length === 0}
              className={`px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 text-sm sm:text-base
            ${
              selectedTasks.length === 0 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            >
              Delete selected
            </button>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <div className="relative" ref={sortDropdownRef}>
              <button
                className="px-4 py-2 bg-gray-600 text-white rounded-md flex items-center gap-2"
                onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
              >
                ↕ Sort
              </button>
              {isSortDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-30">
                  <div className="py-1">
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                      onClick={() => {
                        handleSort("startTime");
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Start time: ASC
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                      onClick={() => {
                        handleSort("startTime");
                        setSortOrder("DESC");
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      Start time: DESC
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                      onClick={() => {
                        handleSort("endTime");
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      End time: ASC
                    </button>
                    <button
                      className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                      onClick={() => {
                        handleSort("endTime");
                        setSortOrder("DESC");
                        setIsSortDropdownOpen(false);
                      }}
                    >
                      End time: DESC
                    </button>
                    {sortField && (
                      <button
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 border-t"
                        onClick={() => {
                          setSortField(null);
                          setSortOrder("ASC");
                          setIsSortDropdownOpen(false);
                        }}
                      >
                        Remove sort
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={priorityDropdownRef}>
              <button
                className={`px-4 py-2 bg-white border rounded-md flex items-center gap-2 ${
                  priorityFilter
                    ? "border-blue-500 text-blue-600"
                    : "border-gray-300"
                }`}
                onClick={() =>
                  setIsPriorityDropdownOpen(!isPriorityDropdownOpen)
                }
              >
                Priority {priorityFilter ? `: ${priorityFilter}` : "▼"}
              </button>
              {isPriorityDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-30">
                  <div className="py-1">
                    {[1, 2, 3, 4, 5].map((p) => (
                      <button
                        key={p}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-50 ${
                          priorityFilter === p ? "text-blue-600 bg-blue-50" : ""
                        }`}
                        onClick={() => {
                          setPriorityFilter(priorityFilter === p ? null : p);
                          setIsPriorityDropdownOpen(false);
                        }}
                      >
                        {p}
                      </button>
                    ))}
                    {priorityFilter !== null && (
                      <button
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 border-t"
                        onClick={() => {
                          setPriorityFilter(null);
                          setIsPriorityDropdownOpen(false);
                        }}
                      >
                        Remove filter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" ref={statusDropdownRef}>
              <button
                className={`px-4 py-2 bg-white border rounded-md flex items-center gap-2 ${
                  statusFilter
                    ? "border-purple-500 text-purple-600"
                    : "border-gray-300"
                }`}
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              >
                Status: {statusFilter || "Finished ▼"}
              </button>
              {isStatusDropdownOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border z-30">
                  <div className="py-1">
                    {["Pending", "Finished"].map((s) => (
                      <button
                        key={s}
                        className={`block w-full text-left px-4 py-2 hover:bg-gray-50 ${
                          statusFilter === s
                            ? "text-purple-600 bg-purple-50"
                            : ""
                        }`}
                        onClick={() => {
                          setStatusFilter(
                            statusFilter === s
                              ? null
                              : (s as "Pending" | "Finished")
                          );
                          setIsStatusDropdownOpen(false);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                    {statusFilter && (
                      <button
                        className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-50 border-t"
                        onClick={() => {
                          setStatusFilter(null);
                          setIsStatusDropdownOpen(false);
                        }}
                      >
                        Remove filter
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-600 text-white">
                  <th className="px-4 sm:px-6 py-3 text-left whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTasks?.length === filteredTasks?.length}
                      onChange={() => {
                        setSelectedTasks(
                          selectedTasks?.length === filteredTasks?.length
                            ? []
                            : filteredTasks?.map((t) => t.id)
                        );
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium whitespace-nowrap">
                    ID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium">
                    Title
                  </th>
                  <th className="hidden sm:table-cell px-4 sm:px-6 py-3 text-left text-sm font-medium">
                    Priority
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium whitespace-nowrap">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-sm font-medium">
                    Start Time
                  </th>
                  <th className="hidden md:table-cell px-4 sm:px-6 py-3 text-left text-sm font-medium">
                    End Time
                  </th>
                  <th className="hidden lg:table-cell px-4 sm:px-6 py-3 text-left text-sm font-medium">
                    Time (hrs)
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-sm font-medium">
                    Edit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTasks?.length > 0 ? (
                  filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => {
                            setSelectedTasks((prev) =>
                              prev.includes(task.id)
                                ? prev.filter((id) => id !== task.id)
                                : [...prev, task.id]
                            );
                          }}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {task.id}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                        {task.title}
                      </td>
                      <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-sm text-gray-900">
                        {task.priority}
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-sm whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs
                    ${
                      task.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                        >
                          {task.status}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(task.startTime).toLocaleString()}
                      </td>
                      <td className="hidden md:table-cell px-4 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                        {new Date(task.endTime).toLocaleString()}
                      </td>
                      <td className="hidden lg:table-cell px-4 sm:px-6 py-4 text-sm text-gray-900">
                        {task.timeToFinish}
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setTitle(task.title);
                            setPriority(task.priority);
                            setStatus(task.status);
                            setStartTime(
                              new Date(task.startTime)
                                .toISOString()
                                .slice(0, 16)
                            );
                            setEndTime(
                              new Date(task.endTime).toISOString().slice(0, 16)
                            );
                            setShowModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 sm:px-6 py-4 text-center text-gray-500"
                    >
                      {loading
                        ? "Loading tasks..."
                        : "No tasks found with the current filters"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden">
            {filteredTasks?.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredTasks.map((task) => (
                  <div key={task.id} className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedTasks.includes(task.id)}
                          onChange={() => {
                            setSelectedTasks((prev) =>
                              prev.includes(task.id)
                                ? prev.filter((id) => id !== task.id)
                                : [...prev, task.id]
                            );
                          }}
                          className="rounded border-gray-300 w-5 h-5"
                        />
                        <span className="font-medium">{task.title}</span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingTask(task);
                          setTitle(task.title);
                          setPriority(task.priority);
                          setStatus(task.status);
                          setStartTime(
                            new Date(task.startTime).toISOString().slice(0, 16)
                          );
                          setEndTime(
                            new Date(task.endTime).toISOString().slice(0, 16)
                          );
                          setShowModal(true);
                        }}
                        className="text-blue-600 p-2 hover:bg-blue-50 rounded-full"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                      <div>
                        <span className="font-medium">Priority:</span>{" "}
                        {task.priority}
                      </div>
                      <div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs
                        ${
                          task.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                        >
                          {task.status}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Start:</span>{" "}
                        {new Date(task.startTime).toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">End:</span>{" "}
                        {new Date(task.endTime).toLocaleString()}
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Time to finish:</span>{" "}
                        {task.timeToFinish} hrs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                {loading
                  ? "Loading tasks..."
                  : "No tasks found with the current filters"}
              </div>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold mb-4">
                {editingTask ? "Edit task" : "Add new task"}
              </h2>

              <form onSubmit={handleTaskSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter task title"
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {[1, 2, 3, 4, 5].map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Status
                    </label>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-600">Pending</span>
                      <button
                        type="button"
                        onClick={() =>
                          setStatus(
                            status === "Pending" ? "Finished" : "Pending"
                          )
                        }
                        className="relative inline-flex items-center h-6 rounded-full w-11 focus:outline-none bg-gray-200"
                        role="switch"
                        aria-checked={status === "Finished"}
                      >
                        <span
                          className={`${
                            status === "Finished"
                              ? "translate-x-6 bg-blue-600"
                              : "translate-x-1 bg-white"
                          } inline-block w-4 h-4 transform rounded-full transition-transform duration-200 ease-in-out shadow-sm`}
                        />
                      </button>
                      <span className="text-sm text-gray-600">Finished</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Start time
                    </label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      End time
                    </label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingTask ? "Update" : "Add task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
