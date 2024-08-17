import { TypedEventEmitter } from '@/utils';

describe(TypedEventEmitter, () => {
  test('should emit events to listeners', async () => {
    const emitter = new TypedEventEmitter<{ foo: [string]; bar: [number] }>();
    const fooListener = jest.fn();
    const barListener = jest.fn();

    emitter.on('foo', fooListener);
    emitter.on('bar', barListener);

    await emitter.emit('foo', 'hello');
    await emitter.emit('bar', 42);

    expect(fooListener).toHaveBeenCalledWith('hello');
    expect(barListener).toHaveBeenCalledWith(42);
  });

  test('should emit events to multiple listeners', async () => {
    const emitter = new TypedEventEmitter<{ foo: [string] }>();
    const fooListener1 = jest.fn();
    const fooListener2 = jest.fn();

    emitter.on('foo', fooListener1);
    emitter.on('foo', fooListener2);

    await emitter.emit('foo', 'hello');

    expect(fooListener1).toHaveBeenCalledWith('hello');
    expect(fooListener2).toHaveBeenCalledWith('hello');
  });

  test('should emit events in the order they were added', async () => {
    const emitter = new TypedEventEmitter<{ foo: [string] }>();
    const fooListener1 = jest.fn();
    const fooListener2 = jest.fn();

    emitter.on('foo', fooListener1);
    emitter.on('foo', fooListener2);

    await emitter.emit('foo', 'hello');

    expect(fooListener1).toHaveBeenCalledBefore(fooListener2);
  });

  test('should not throw when emitting events without listeners', async () => {
    const emitter = new TypedEventEmitter<{ foo: [string] }>();

    await expect(emitter.emit('foo', 'hello')).resolves.not.toThrow();
  });

  test('should work with async listeners', async () => {
    const emitter = new TypedEventEmitter<{ foo: [string] }>();
    const fooListener = jest.fn();

    emitter.on('foo', async (message) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      fooListener(message);
    });

    await emitter.emit('foo', 'hello');

    expect(fooListener).toHaveBeenCalledWith('hello');
  });

  test('should remove listeners', async () => {
    const emitter = new TypedEventEmitter<{ foo: [string] }>();
    const fooListener = jest.fn();

    emitter.on('foo', fooListener);
    emitter.off('foo', fooListener);

    await emitter.emit('foo', 'hello');

    expect(fooListener).not.toHaveBeenCalled();
  });

  test('should not throw when removing listeners that do not exist', () => {
    const emitter = new TypedEventEmitter<{ foo: [string] }>();
    const fooListener = jest.fn();

    expect(() => emitter.off('foo', fooListener)).not.toThrow();
  });

  test('should remove only the specified event', async () => {
    const emitter = new TypedEventEmitter<{
      foo: [string];
      bar: [number];
    }>();

    const fooListener = jest.fn();
    const barListener = jest.fn();

    emitter.on('foo', fooListener);
    emitter.on('bar', barListener);
    emitter.off('foo');

    await emitter.emit('foo', 'hello');
    await emitter.emit('bar', 42);

    expect(fooListener).not.toHaveBeenCalled();
    expect(barListener).toHaveBeenCalled();
  });

  test('should remove only the specified listener', async () => {
    const emitter = new TypedEventEmitter<{
      foo: [string];
    }>();
    const fooListener1 = jest.fn();
    const fooListener2 = jest.fn();

    emitter.on('foo', fooListener1);
    emitter.on('foo', fooListener2);
    emitter.off('foo', fooListener1);

    await emitter.emit('foo', 'hello');

    expect(fooListener1).not.toHaveBeenCalled();
    expect(fooListener2).toHaveBeenCalled();
  });

  test('should remove only the specified listener from the specified event', async () => {
    const emitter = new TypedEventEmitter<{
      foo: [string];
      bar: [string];
    }>();
    const fooListener = jest.fn();
    const barListener = jest.fn();

    emitter.on('foo', fooListener);
    emitter.on('bar', barListener);
    emitter.off('foo', fooListener);

    await emitter.emit('foo', 'hello');
    await emitter.emit('bar', 'world');

    expect(fooListener).not.toHaveBeenCalled();
    expect(barListener).toHaveBeenCalled();
  });

  test('should remove once listeners after being called', async () => {
    const emitter = new TypedEventEmitter<{ foo: [string] }>();
    const fooListener = jest.fn();

    emitter.once('foo', fooListener);

    await emitter.emit('foo', 'hello');
    await emitter.emit('foo', 'world');

    expect(fooListener).toHaveBeenCalledOnce();
  });

  test('should pass single argument types to listeners', async () => {
    const emitter = new TypedEventEmitter<{ single: string }>();

    emitter.on('single', (arg) => expect(arg).toBeString());

    await emitter.emit('single', 'hello');
  });

  test('should pass array argument types to listeners', async () => {
    const emitter = new TypedEventEmitter<{ array: [str: string, num: number] }>();

    emitter.on('array', (str, num) => {
      expect(str).toBeString();
      expect(num).toBeNumber();
    });

    await emitter.emit('array', 'world', 42);
  });

  test('should pass object argument types to listeners', async () => {
    const emitter = new TypedEventEmitter<{ object: { str: string; num: number } }>();

    emitter.on('object', ({ str, num }) => {
      expect(str).toBeString();
      expect(num).toBeNumber();
    });

    await emitter.emit('object', { str: 'foo', num: 24 });
  });

  test('should pass complex argument types to listeners', async () => {
    const emitter = new TypedEventEmitter<{
      complex: [obj: { str: string; num: number }, arr: [bool: boolean], str: string, num: number];
    }>();

    emitter.on('complex', (obj, [bool], str, num) => {
      expect(obj.str).toBeString();
      expect(obj.num).toBeNumber();
      expect(bool).toBeBoolean();
      expect(str).toBeString();
      expect(num).toBeNumber();
    });

    await emitter.emit('complex', { str: 'foo', num: 24 }, [true], 'hello', 42);
  });
});
