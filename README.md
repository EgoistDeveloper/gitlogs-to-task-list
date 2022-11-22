# gitlogs-to-task-list

This is a simple script to convert git logs to a task list. Then you can use the task list to generate a changelog or you can import it to a task management tool.

## Usage

```bash
ts-node index.ts
```

If you don't have `ts-node` installed, you can install it with `npm install -g ts-node typescript '@types/node`.

## Configuration

You can configure the script by editing the `index.ts` file with `configs` object.

```typescript
const configs: any = {
  elapsedTimeMinimum: 5, // in minutes
  elapsedTimeMaximum: 300, // in minutes
  elapsedTimeNextDayDelay: 600, // in minutes
  excludes: [
    "Merge branch",
    "Merge remote-tracking branch",
    "Merge pull request",
    "Wip",
  ],
};
```