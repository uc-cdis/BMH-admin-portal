'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function RequestWorkspaceForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    workspaceType: 'STRIDES Grant',
    nihAwardNumber: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_GW_ENDPOINT}/workspaces/request`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.NEXT_PUBLIC_API_KEY!,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        router.push('/?success=workspace_requested');
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      alert('Failed to submit workspace request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Workspace Type
        </label>
        <select
          value={formData.workspaceType}
          onChange={(e) =>
            setFormData({ ...formData, workspaceType: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="STRIDES Grant">STRIDES Grant</option>
          <option value="STRIDES Credits">STRIDES Credits</option>
          <option value="Direct Pay">Direct Pay</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          NIH Award/Grant Number
        </label>
        <input
          type="text"
          value={formData.nihAwardNumber}
          onChange={(e) =>
            setFormData({ ...formData, nihAwardNumber: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
