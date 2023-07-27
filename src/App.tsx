import React, {
  useEffect, useState, useMemo, FormEvent, useCallback,
} from 'react';
import { UserWarning } from './UserWarning';
import { Todo, TodoStatus } from './types/Todo';
import {
  createTodo, deleteTodo, getTodos, updateTodo,
} from './api/todos';
import { filterTodos } from './utils/todoUtil';
import { TodoList } from './components/TodoList';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorMessage } from './components/ErrorMessage';

const USER_ID = 11082;

export const App: React.FC = () => {
  // #region states
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filterBy, setFilterBy] = useState(TodoStatus.ALL);
  const [errorMessage, setErrorMessage] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [activeTodosId, setActiveTodosId] = useState<number[]>([]);
  const [temporatyTodo, setTemporatyTodo] = useState<Todo | null>(null);
  // #endregion

  // #region handlers
  const handleTodoDelete = useCallback((todoId: number) => {
    setActiveTodosId([todoId]);

    deleteTodo(todoId)
      .then(() => {
        setTodos(prev => prev.filter(todo => todo.id !== todoId));
      })
      .catch(() => setErrorMessage('Unable to delete todo'))
      .finally(() => {
        setActiveTodosId([]);
        setTitle('');
      });
  }, []);

  const handleTodoAdd = useCallback((event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!title) {
      setErrorMessage('Title can\'t be empty');

      return;
    }

    const todo = {
      id: 0,
      title,
      userId: USER_ID,
      completed: false,
    };

    setTemporatyTodo(todo);
    createTodo(todo)
      .then(newTodo => {
        setTodos(prev => [...prev, newTodo]);
        setTitle('');
      })
      .finally(() => {
        setTemporatyTodo(null);
      });
  }, [title]);

  const handleCheckedChange = (todoId: number, completed: boolean) => {
    setActiveTodosId([todoId]);

    const updatedTodo = {
      completed: !completed,
    };

    updateTodo(todoId, updatedTodo)
      .then(() => setTodos(prev => {
        return prev.map(todo => {
          return todo.id === todoId ? { ...todo, completed: !completed } : todo;
        });
      }))
      .catch(error => {
        setErrorMessage(error.message);
      })
      .finally(() => setActiveTodosId([]));
  };
  // #endregion

  useEffect(() => {
    setIsLoading(true);

    getTodos(USER_ID)
      .then(setTodos)
      .catch((error) => {
        setErrorMessage(error.message);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const visibleTodos = useMemo(() => {
    return filterTodos(todos, filterBy);
  }, [todos, filterBy]);

  const activeTodos = useMemo(() => {
    return filterTodos(todos, TodoStatus.ACTIVE);
  }, [todos]);

  const isDisabled = activeTodosId.length > 0 && isLoading;

  if (!USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          title={title}
          setTitle={setTitle}
          isDisabled={isDisabled}
          activeTodosQuantity={activeTodos.length}
          onAdd={handleTodoAdd}
        />

        <TodoList
          todos={visibleTodos}
          activeTodosId={activeTodosId}
          temporaryTodo={temporatyTodo}
          onDelete={handleTodoDelete}
          isDeleteDisabled={isDisabled}
          onCheckedChange={handleCheckedChange}
        />

        {todos.length > 0 && (
          <Footer
            filterBy={filterBy}
            setFilterBy={setFilterBy}
            activeTodosQuantity={activeTodos.length}
            completedTodosQuantity={todos.length - activeTodos.length}
          />
        )}
      </div>

      {/* Notification is shown in case of any error */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <ErrorMessage
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
      {isLoading}
    </div>
  );
};
