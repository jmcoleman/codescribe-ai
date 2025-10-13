/**
 * Sample React component fixtures for testing
 */

module.exports = {
  // Functional component with hooks
  functionalComponent: `
import React, { useState } from 'react';

/**
 * Counter component with increment functionality
 * @param {Object} props - Component props
 * @param {number} props.initialCount - Starting count value
 * @returns {JSX.Element} Counter component
 */
function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  const increment = () => {
    setCount(count + 1);
  };

  const decrement = () => {
    setCount(count - 1);
  };

  const reset = () => {
    setCount(initialCount);
  };

  return (
    <div className="counter">
      <h2>Count: {count}</h2>
      <button onClick={increment}>Increment</button>
      <button onClick={decrement}>Decrement</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default Counter;
`,

  // Class component
  classComponent: `
import React, { Component } from 'react';

/**
 * Counter class component
 */
class Counter extends Component {
  constructor(props) {
    super(props);
    this.state = {
      count: props.initialCount || 0,
    };
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  decrement = () => {
    this.setState({ count: this.state.count - 1 });
  };

  reset = () => {
    this.setState({ count: this.props.initialCount || 0 });
  };

  render() {
    return (
      <div className="counter">
        <h2>Count: {this.state.count}</h2>
        <button onClick={this.increment}>Increment</button>
        <button onClick={this.decrement}>Decrement</button>
        <button onClick={this.reset}>Reset</button>
      </div>
    );
  }
}

export default Counter;
`,

  // Component with useEffect
  componentWithEffect: `
import React, { useState, useEffect } from 'react';

/**
 * User profile component that fetches data
 * @param {Object} props
 * @param {string} props.userId - User ID to fetch
 */
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(\`/api/users/\${userId}\`);
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
}

export default UserProfile;
`,
};
