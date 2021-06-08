import React, { useState, useEffect } from "react";
import "./Home.css";

const options = {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  second: "numeric",
};

const Home = () => {
  const [messages, setMessages] = useState([]);
  const [connectionsNumber, setConnectionsNumber] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource("/events/messages");

    const handleMessage = (event) => {
      setMessages((prevValue) => [
        ...prevValue,
        `${new Date().toLocaleDateString("en-US", options)}: ${event.data}`,
      ]);
    };

    const handleConnection = (event) => {
      setConnectionsNumber(event.data);
    };

    eventSource.onerror = (event) => {
      console.log(`Got an error, here is an event:`, event);
    };

    eventSource.onopen = (event) => {
      console.log(`Connection was opened, here is the event:`, event);
    };

    eventSource.addEventListener("new-message", handleMessage);
    eventSource.addEventListener("new-connection", handleConnection);

    return () => {
      eventSource.removeEventListener("new-message", handleMessage);
      eventSource.removeEventListener("new-connection", handleConnection);
      eventSource.close();
    };
  }, []);

  return (
    <div>
      <div className="Home-header">
        <h2>SSE example</h2>
      </div>
      <div className="Home-intro">Connections: {connectionsNumber}</div>
      <p className="Home-intro">Events list:</p>
      <ul className="Home-resources">
        {messages.map((message) => (
          <li key={message}>{message}</li>
        ))}
      </ul>
    </div>
  );
};

export default Home;
