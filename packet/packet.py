DEFAULT_PACKET_DURATION_MS = 50

class Packet:
    def __init__(self):
        self.receivers_id = []
        self.start_emission_time = None
        self.end_emission_time = None
        self.first_end_reception_time = None
        self.start_reception_time_per_receiver = {}
        self.end_reception_time_per_receiver = {}
	def set_emission_info(self, sender_id, data, start_emission_time):
		self.start_emission_time = start_emission_time
		self.end_emission_time = start_emission_time + DEFAULT_PACKET_DURATION_MS
	def add_receiver(self, receiver_id, start_reception_time, end_reception_time):
		self.receivers_id.append(receiver_id);
		if start_reception_time is None:
			# unknown reception time
			start_reception_time = end_reception_time - DEFAULT_PACKET_DURATION_MS
		self.start_reception_time_per_receiver[receiver_id] = start_reception_time
		self.end_reception_time_per_receiver[receiver_id] = end_reception_time
    	if self.first_end_reception_time is None or end_reception_time < self.first_end_reception_time:
			self.first_end_reception_time = end_reception_time
	def set_end_emission_time(self, in_end_emission_time):
		self.end_emission_time = in_end_emission_time
