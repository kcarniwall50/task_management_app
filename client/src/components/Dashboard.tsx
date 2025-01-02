import React, { useState, useEffect } from 'react';
import { Loader, ClipboardList } from 'lucide-react';

type DashboardData = {
  summary: {
    totalTasks: number;
    tasksCompleted: number;
    tasksPending: number;
    averageTimePerCompletedTask: number;
  };
  pendingSummary: {
    pendingTasks: number;
    totalTimeLapsed: number;
    totalTimeToFinish: number;
  };
  priorityWiseData: Array<{
    priority: number;
    pendingTasks: number;
    timeLapsed: number;
    timeToFinish: number;
  }>;
};

const BACKEND_URL = process.env.REACT_APP_SERVER_URL;

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}api/tasks/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data');
      const data = await response.json();
      setDashboardData(data.data);
    } catch (err) {
      console.log(err)
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="animate-spin h-6 w-6 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        {error}
      </div>
    );
  }

  if (!dashboardData || dashboardData.summary.totalTasks === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <ClipboardList className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Dashboard Data Available
          </h2>
          <p className="text-gray-600">
            Create tasks to view your task statistics and progress summary. You'll be able to track completion rates, time metrics, and priority-based analytics here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">
              {dashboardData.summary.totalTasks}
            </div>
            <div className="text-sm text-gray-500">Total tasks</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">
              {dashboardData.summary.tasksCompleted}%
            </div>
            <div className="text-sm text-gray-500">Tasks completed</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-yellow-600">
              {dashboardData.summary.tasksPending}%
            </div>
            <div className="text-sm text-gray-500">Tasks pending</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-purple-600">
              {dashboardData.summary.averageTimePerCompletedTask}
            </div>
            <div className="text-sm text-gray-500">Average time per completed task</div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Pending task summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-blue-600">
              {dashboardData.pendingSummary.pendingTasks}
            </div>
            <div className="text-sm text-gray-500">Pending tasks</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-orange-600">
              {dashboardData.pendingSummary.totalTimeLapsed} hrs
            </div>
            <div className="text-sm text-gray-500">Total time lapsed</div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-3xl font-bold text-green-600">
              {dashboardData.pendingSummary.totalTimeToFinish} hrs
            </div>
            <div className="text-sm text-gray-500">
              Total time to finish
              <div className="text-xs text-gray-400 italic">
                estimated based on endtime
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="bg-gray-600 text-white">
              <th className="px-4 py-3 text-left text-sm font-medium">Task priority</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Pending tasks</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Time lapsed (hrs)</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Time to finish (hrs)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {dashboardData.priorityWiseData.map((row) => (
              <tr key={row.priority} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{row.priority}</td>
                <td className="px-4 py-3 text-sm">{row.pendingTasks}</td>
                <td className="px-4 py-3 text-sm">{row.timeLapsed}</td>
                <td className="px-4 py-3 text-sm">{row.timeToFinish}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;