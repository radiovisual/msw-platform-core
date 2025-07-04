import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import MockUI from "./MockUI";
import { createMockPlatform } from "../platform";
import { mswHandlersFromPlatform } from "../adapters/msw";

// Create a mock platform instance
const platform = createMockPlatform({
  name: "storybook-demo",
  plugins: [
    {
      id: "hello",
      componentId: "Greeting",
      endpoint: "/api/hello",
      method: "GET",
      responses: {
        200: { message: "Hello, world!" },
        404: { error: "Not found" },
      },
      swaggerUrl: "https://jsonplaceholder.typicode.com/users/1",
      defaultStatus: 200,
      featureFlags: ["EXPERIMENTAL_HELLO"],
      transform: (response, flags) => {
        if (flags.EXPERIMENTAL_HELLO) {
          return { ...response, message: "Hello, experimental world!" };
        }
        return response;
      },
    },
    {
      id: "goodbye",
      componentId: "Farewell",
      endpoint: "/api/goodbye",
      method: "GET",
      responses: {
        200: { message: "Goodbye!" },
        404: { error: "Not found" },
      },
      defaultStatus: 200,
    },
    {
      id: "user",
      componentId: "User",
      endpoint: "/api/user",
      method: "GET",
      responses: {
        200: { message: "User is Michael!" },
        404: { error: "Not found" },
      },
      defaultStatus: 200,
      queryResponses: {
        "type=admin": { 200: { message: "User is Admin!" } },
        "type=guest": { 200: { message: "User is Guest!" } },
      },
    },
    {
      id: "user-status",
      componentId: "User",
      endpoint: "/api/user-status",
      method: "GET",
      responses: {
        200: { status: "unknown" },
        404: { error: "Not found" },
      },
      defaultStatus: 200,
      scenarios: [
        { id: "guest", label: "Guest User", responses: { 200: { status: "guest" } } },
        { id: "member", label: "Member User", responses: { 200: { status: "member" } } },
        { id: "admin", label: "Admin User", responses: { 200: { status: "admin" } } },
      ],
    },
    {
      id: "external-user",
      componentId: "External",
      endpoint: "https://jsonplaceholder.typicode.com/users/1",
      method: "GET",
      responses: {
        200: { name: "Mocked User", email: "mock@example.com" },
      },
      defaultStatus: 200,
    },
  ],
  featureFlags: ["EXPERIMENTAL_HELLO"],
});

// Demo component that fetches from the endpoint
function DemoApp() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchHello = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/hello");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
  };
  const fetchGoodbye = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/goodbye");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
  };
  const fetchUser = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
  };
  const fetchUserStatus = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/user-status");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
  };
  const fetchExternalUser = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("https://jsonplaceholder.typicode.com/users/1");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
  };
  const fetchUserAdmin = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/user?type=admin");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
  };
  const fetchUserGuest = async () => {
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/user?type=guest");
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setError(String(e));
    }
  };
  return (
    <div style={{ padding: 32 }}>
      <h2 className="text-xl font-bold mb-4">Demo: /api/hello & /api/goodbye</h2>
      <button className="border rounded px-4 py-2 mb-4" onClick={fetchHello}>
        Fetch /api/hello
      </button>
      <button className="border rounded px-4 py-2 mb-4" onClick={fetchGoodbye} style={{ marginLeft: 8 }}>
        Fetch /api/goodbye
      </button>
      <button className="border rounded px-4 py-2 mb-4" onClick={fetchUser} style={{ marginLeft: 8 }}>
        Fetch /api/user
      </button>
      <button className="border rounded px-4 py-2 mb-4" onClick={fetchUserAdmin} style={{ marginLeft: 8 }}>
        Fetch /api/user?type=admin
      </button>
      <button className="border rounded px-4 py-2 mb-4" onClick={fetchUserGuest} style={{ marginLeft: 8 }}>
        Fetch /api/user?type=guest
      </button>
      <button className="border rounded px-4 py-2 mb-4" onClick={fetchUserStatus} style={{ marginLeft: 8 }}>
        Fetch /api/user-status
      </button>
      <button className="border rounded px-4 py-2 mb-4" onClick={fetchExternalUser} style={{ marginLeft: 8 }}>
        Fetch https://jsonplaceholder.typicode.com/users/1
      </button>
      <pre className="bg-gray-100 p-2 rounded">
        {result ? JSON.stringify(result, null, 2) : error ? error : "No data yet"}
      </pre>
      <MockUI platform={platform} />
    </div>
  );
}

const meta: Meta<typeof DemoApp> = {
  title: "MockUI/Popup",
  component: DemoApp,
};
export default meta;

type Story = StoryObj<typeof DemoApp>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: mswHandlersFromPlatform(platform),
    },
  },
};

export const WithFlagEnabled: Story = {
  parameters: {
    msw: {
      handlers: mswHandlersFromPlatform(platform),
    },
  },
  render: () => {
    // Enable the feature flag before rendering
    platform.setFeatureFlag("EXPERIMENTAL_HELLO", true);
    return <DemoApp />;
  },
}; 