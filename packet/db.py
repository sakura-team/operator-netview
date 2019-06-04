import bisect
from packet.packet import Packet

# This object is a database of the transmitted packets.
# It is needed by netview to schedule them.
class PacketDB:
	def __init__(self, analyser):
        self.analyser = analyser
        # data about flying packets (sender, receivers, timestamps...)
        # indexed by emission
		self.flying_packets_per_emission = {}
        # emission events indexed by packet content
        # useful to match emission / recepton(s)
		self.emission_event_per_content = {}
        # emission events ordered by emission time
        # useful to discard older events
		self.emission_events_ordered_by_time = []
        # currently processed emission event of a given node
        # useful to know which emission a txEnd event is about
		self.current_emission_per_sender = {}
        # rx_start time of a given node receiving data
        # this has to be recorded at the RxStart event because
        # we don't know yet which packet it is related to.
		self.rx_start_times_per_receiver = {}

	def discardObsoleteEmissionData(self):
		# the replay delay determines the frontier between data
		# considered obsolete and data considered in the packet
		# traffic analysis.
		# Here we use twice this value in order to avoid any
		# inconsistency occuring very near this frontier w.r.t.
		# delays between GUI / backend.
		while len(self.emission_events_ordered_by_time) > 0 and \
			      self.emission_events_ordered_by_time[0].ts < \
				  self.analyser.last_ts - 2*config.REPLAY_DELAY:
			self.discard_packet(self.emission_events_ordered_by_time[0])

	# TxStart event: record info about the sender,
	# the content and the start emission time.
	def txStart(self, tx_start_info):
		sender_id = tx_start_info.node_id
		data = tx_start_info.data
		# free any obsolete data before allocating
		self.discardObsoleteEmissionData()
		pt = Packet()
		pt.set_emission_info(
				sender_id,
				data,
				tx_start_info.ts)
		self.emission_event_per_content[data] = tx_start_info
        bisect.insort_left(self.emission_events_ordered_by_time, tx_start_info)
		self.flying_packets_per_emission[tx_start_info] = pt
		self.current_emission_per_sender[sender_id] = tx_start_info

	# TxEnd event: retrieve which packet it is about,
	# given the sender id, and update the end emission time.
	def txEnd(self, log_info):
		sender_id = log_info.node_id
		pt = None
		tx_start_info = self.current_emission_per_sender.get(sender_id)
		if tx_start_info is not None:
			pt = self.flying_packets_per_emission.get(tx_start_info)
			# txEnd is the end of the emission...
			self.current_emission_per_sender.remove(sender_id)
		if pt is None:
			log_info.recordInconsistency("no recent Tx_start found for this Tx_end log event.")
		else:
			pt.set_end_emission_time(log_info.ts)

	# RxStart event: for now we don't know which packet this is about.
	# We just record this recepton start time for the current receiver node.
	def rxStart(self, log_info):
		receiver_id = log_info.node_id
		if receiver_id not in self.rx_start_times_per_receiver:
			self.rx_start_times_per_receiver[receiver_id] = []
		self.rx_start_times_per_receiver[receiver_id].append(log_info.ts)

	# RxEnd event: retrieve which packet it is about and
	# add info about this receiver.
	# In order to retrieve which packet it is, we try to find
	# a packet previously sent (see the txStart event),
	# with the same content.
	# The info we can store about this receiver is:
	# - its id
	# - the start reception time (saved at the rxStart event)
	# - the end reception time
	def rxEnd(self, log_info):
		data_buffer = log_info.data
		tx_start_info = self.emission_event_per_content.get(data_buffer)
		if tx_start_info is None:
			log_info.recordInconsistency("packet data from RxEnd not found in any recent TxStart.")
		else:
			pt = self.flying_packets_per_emission.get(tx_start_info)
			receiver_id = log_info.node_id
			rxstart_times = self.rx_start_times_per_receiver.get(receiver_id)
			if rxstart_times is None or len(rxstart_times) == 0:
				log_info.recordInconsistency("no RxStart found for this RxEnd.")
				start_recepton_time = None
			else:
				start_recepton_time = rxstart_times.pop(0)
			end_recepton_time = log_info.ts
			pt.addReceiver(receiver_id, start_recepton_time, end_recepton_time)

	def discard_packet(self, tx_start_info):
		data_buffer = tx_start_info.data
		del self.emission_event_per_content[data_buffer]
		del self.flying_packets_per_emission[tx_start_info]
		self.emission_events_ordered_by_time.remove(tx_start_info)

	/* each time we send a packet, the vizwalt radio medium
	   instance will need to get the list of receivers, which will
	   cause the following function to be called. */
	def getReceiverIDs(self, ReceiversRequest r):

		ReceiversResponse response = new ReceiversResponse()
		sender_id = r.sender_id

		/* if the same sender sends several packets in a short time
		 * (e.g. because of fragmentation), the sender id is not enough
		 * information to know which packet this request refers to.
		 * However, all this works in sequential way,
		 * so we always consider the oldest packet of the sender,
		 * and we are fine.
		 */
		oldest = getInfoAboutOldestPacket(sender_id)
		if (oldest is not None) # None should not occur
		{
			pt = self.flying_packets_per_emission.get(oldest)

			for (receiver : pt.getReceiversId())
			{
				response.content.add(receiver)
			}

			# we can now forget about this packet.
			discard_packet(oldest)
		}

		return response
	}
