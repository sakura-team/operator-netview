
class LogAnalyser:
    def __init__(self):
        self.time_range = [None, None]
        self.events = []
    def analyse_line(self, line):
        line = line.split('#')[0].strip()
        if line == '':
            return
        tokens = line.split(':')
        try:
            ts = int(float(tokens[0]) * 1000)
            node_num = int(tokens[1])
            action = tokens[2]
        except:
            print('Invalid line: "' + line + '" -- ignored.')
            return
        if self.time_range[0] is None:
            self.time_range[0] = ts
        self.time_range[1] = ts
        event = {
            'node': node_num,
            'ts': ts
        }
        if action == 'MoveTo':
            try:
                x, y = tokens[3].split(',')[:2]
            except:
                print('Invalid move line: "' + line + '" -- ignored.')
                return
            event.update({
                'type': 'move',
                'x': x,
                'y': y
            })
        else:
            if action == 'SerialLog':
                info = ':'.join(tokens[3:])
            else:
                info = ':'.join(tokens[2:])
            event.update({
                'type': 'serial',
                'info': info
            })
        self.events.append(event)

analyser = LogAnalyser()
with open('sample_traces.wlt') as f:
    for line in f:
        analyser.analyse_line(line)
