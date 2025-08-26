import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  HStack,
  Text,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Input,
  Select,
  Switch,
  FormControl,
  FormLabel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  Card,
  CardBody,
  CardHeader,
  Heading,
  IconButton,
  useToast,
  Flex,
  Divider
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Bell, 
  Clock, 
  TrendingUp, 
  Edit2, 
  Trash2, 
  Play, 
  Pause,
  Settings,
  BarChart3,
  Globe,
  Zap
} from 'lucide-react'
import { format, addMinutes, addHours } from 'date-fns'

const MotionCard = motion(Card)
const MotionBox = motion(Box)

function App() {
  const [alarms, setAlarms] = useState([])
  const [currentTime, setCurrentTime] = useState(new Date())
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingAlarm, setEditingAlarm] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    time: '',
    type: 'time',
    enabled: true,
    sound: true
  })
  const toast = useToast()

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Load alarms from localStorage
  useEffect(() => {
    const savedAlarms = localStorage.getItem('traderswall-alarms')
    if (savedAlarms) {
      setAlarms(JSON.parse(savedAlarms))
    }
  }, [])

  // Save alarms to localStorage
  useEffect(() => {
    localStorage.setItem('traderswall-alarms', JSON.stringify(alarms))
  }, [alarms])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Check for triggered alarms
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date()
      const currentTimeString = format(now, 'HH:mm')
      
      alarms.forEach(alarm => {
        if (alarm.enabled && alarm.time === currentTimeString && !alarm.triggered) {
          triggerAlarm(alarm)
          setAlarms(prev => prev.map(a => 
            a.id === alarm.id ? { ...a, triggered: true } : a
          ))
        }
      })
    }
    
    const interval = setInterval(checkAlarms, 1000)
    return () => clearInterval(interval)
  }, [alarms])

  const triggerAlarm = (alarm) => {
    // Show notification
    if (Notification.permission === 'granted') {
      new Notification(`TradersWall Alert: ${alarm.name}`, {
        body: `Time to ${alarm.name.toLowerCase()}!`,
        icon: '/favicon.ico'
      })
    }

    // Show toast
    toast({
      title: `Alarm: ${alarm.name}`,
      description: `Time to ${alarm.name.toLowerCase()}!`,
      status: 'info',
      duration: 5000,
      isClosable: true,
      position: 'top'
    })

    // Play sound (simple beep)
    if (alarm.sound) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 1)
    }
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.time) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        status: 'error',
        duration: 3000,
        isClosable: true
      })
      return
    }

    const newAlarm = {
      id: editingAlarm ? editingAlarm.id : Date.now(),
      ...formData,
      triggered: false,
      createdAt: new Date().toISOString()
    }

    if (editingAlarm) {
      setAlarms(prev => prev.map(alarm => 
        alarm.id === editingAlarm.id ? newAlarm : alarm
      ))
    } else {
      setAlarms(prev => [...prev, newAlarm])
    }

    setFormData({ name: '', time: '', type: 'time', enabled: true, sound: true })
    setEditingAlarm(null)
    onClose()

    toast({
      title: editingAlarm ? 'Alarm Updated' : 'Alarm Created',
      description: `${newAlarm.name} has been ${editingAlarm ? 'updated' : 'created'}`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const handleEdit = (alarm) => {
    setEditingAlarm(alarm)
    setFormData(alarm)
    onOpen()
  }

  const handleDelete = (id) => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== id))
    toast({
      title: 'Alarm Deleted',
      description: 'Alarm has been removed',
      status: 'info',
      duration: 3000,
      isClosable: true
    })
  }

  const toggleAlarm = (id) => {
    setAlarms(prev => prev.map(alarm => 
      alarm.id === id ? { ...alarm, enabled: !alarm.enabled, triggered: false } : alarm
    ))
  }

  const createQuickAlarm = (name, minutes) => {
    const targetTime = addMinutes(new Date(), minutes)
    const newAlarm = {
      id: Date.now(),
      name,
      time: format(targetTime, 'HH:mm'),
      type: 'time',
      enabled: true,
      sound: true,
      triggered: false,
      createdAt: new Date().toISOString()
    }
    setAlarms(prev => [...prev, newAlarm])
    toast({
      title: 'Quick Alarm Set',
      description: `${name} set for ${format(targetTime, 'HH:mm')}`,
      status: 'success',
      duration: 3000,
      isClosable: true
    })
  }

  const activeAlarms = alarms.filter(alarm => alarm.enabled).length
  const totalAlarms = alarms.length

  const marketSessions = [
    { name: 'Tokyo', time: '00:00-09:00', status: 'Open', color: 'green' },
    { name: 'London', time: '08:00-17:00', status: 'Closed', color: 'red' },
    { name: 'New York', time: '13:00-22:00', status: 'Closed', color: 'red' },
    { name: 'Sydney', time: '22:00-07:00', status: 'Open', color: 'green' }
  ]

  return (
    <Box minH="100vh" bg="gray.900" color="white">
      {/* Header */}
      <Box bg="gray.800" borderBottom="1px" borderColor="gray.700" py={4}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Box p={2} bg="green.500" borderRadius="lg">
                <Bell size={24} />
              </Box>
              <VStack align="start" spacing={0}>
                <Heading size="lg" color="green.400">TradersWall</Heading>
                <Text fontSize="sm" color="gray.400">Alarm Service</Text>
              </VStack>
            </HStack>
            <VStack align="end" spacing={0}>
              <Text fontSize="2xl" fontWeight="bold" color="green.400">
                {format(currentTime, 'HH:mm:ss')}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {format(currentTime, 'EEEE, MMM dd, yyyy')}
              </Text>
            </VStack>
          </Flex>
        </Container>
      </Box>

      <Container maxW="7xl" py={8}>
        {/* Stats Dashboard */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <MotionCard
            bg="gray.800"
            borderColor="gray.700"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Active Alarms</StatLabel>
                <StatNumber color="green.400" fontSize="3xl">{activeAlarms}</StatNumber>
                <StatHelpText color="gray.500">Currently enabled</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg="gray.800"
            borderColor="gray.700"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Total Alarms</StatLabel>
                <StatNumber color="blue.400" fontSize="3xl">{totalAlarms}</StatNumber>
                <StatHelpText color="gray.500">All time created</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg="gray.800"
            borderColor="gray.700"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Market Status</StatLabel>
                <StatNumber color="orange.400" fontSize="3xl">2</StatNumber>
                <StatHelpText color="gray.500">Sessions open</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>

          <MotionCard
            bg="gray.800"
            borderColor="gray.700"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Next Alarm</StatLabel>
                <StatNumber color="purple.400" fontSize="xl">
                  {alarms.find(a => a.enabled)?.time || '--:--'}
                </StatNumber>
                <StatHelpText color="gray.500">Upcoming alert</StatHelpText>
              </Stat>
            </CardBody>
          </MotionCard>
        </SimpleGrid>

        {/* Quick Actions */}
        <Card bg="gray.800" borderColor="gray.700" mb={8}>
          <CardHeader>
            <Heading size="md" color="green.400">
              <HStack>
                <Zap size={20} />
                <Text>Quick Alarms</Text>
              </HStack>
            </Heading>
          </CardHeader>
          <CardBody>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              <Button
                colorScheme="green"
                variant="outline"
                size="lg"
                onClick={() => createQuickAlarm('Market Open', 15)}
                leftIcon={<TrendingUp size={18} />}
              >
                Market Open (15m)
              </Button>
              <Button
                colorScheme="blue"
                variant="outline"
                size="lg"
                onClick={() => createQuickAlarm('Trading Break', 30)}
                leftIcon={<Clock size={18} />}
              >
                Break (30m)
              </Button>
              <Button
                colorScheme="purple"
                variant="outline"
                size="lg"
                onClick={() => createQuickAlarm('News Check', 60)}
                leftIcon={<BarChart3 size={18} />}
              >
                News (1h)
              </Button>
              <Button
                colorScheme="orange"
                variant="outline"
                size="lg"
                onClick={() => createQuickAlarm('Market Close', 120)}
                leftIcon={<Settings size={18} />}
              >
                Close (2h)
              </Button>
            </SimpleGrid>
          </CardBody>
        </Card>

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          {/* Alarms List */}
          <Card bg="gray.800" borderColor="gray.700">
            <CardHeader>
              <Flex justify="space-between" align="center">
                <Heading size="md" color="green.400">Your Alarms</Heading>
                <Button
                  colorScheme="green"
                  size="sm"
                  leftIcon={<Plus size={18} />}
                  onClick={() => {
                    setEditingAlarm(null)
                    setFormData({ name: '', time: '', type: 'time', enabled: true, sound: true })
                    onOpen()
                  }}
                >
                  Create Alarm
                </Button>
              </Flex>
            </CardHeader>
            <CardBody>
              {alarms.length === 0 ? (
                <VStack spacing={4} py={8}>
                  <Bell size={48} color="gray" />
                  <Text color="gray.400">No alarms created yet</Text>
                  <Button colorScheme="green" onClick={onOpen}>
                    Create Your First Alarm
                  </Button>
                </VStack>
              ) : (
                <VStack spacing={4}>
                  <AnimatePresence>
                    {alarms.map((alarm) => (
                      <MotionBox
                        key={alarm.id}
                        w="full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Box
                          p={4}
                          bg="gray.700"
                          borderRadius="lg"
                          border="1px"
                          borderColor={alarm.enabled ? "green.500" : "gray.600"}
                        >
                          <Flex justify="space-between" align="center">
                            <VStack align="start" spacing={1}>
                              <Text fontWeight="bold" color={alarm.enabled ? "white" : "gray.400"}>
                                {alarm.name}
                              </Text>
                              <HStack>
                                <Badge colorScheme={alarm.enabled ? "green" : "gray"}>
                                  {alarm.time}
                                </Badge>
                                <Badge variant="outline" colorScheme="blue">
                                  {alarm.type}
                                </Badge>
                                {alarm.sound && (
                                  <Badge variant="outline" colorScheme="purple">
                                    Sound
                                  </Badge>
                                )}
                              </HStack>
                            </VStack>
                            <HStack>
                              <Switch
                                isChecked={alarm.enabled}
                                onChange={() => toggleAlarm(alarm.id)}
                                colorScheme="green"
                              />
                              <IconButton
                                icon={<Edit2 size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="blue"
                                onClick={() => handleEdit(alarm)}
                              />
                              <IconButton
                                icon={<Trash2 size={16} />}
                                size="sm"
                                variant="ghost"
                                colorScheme="red"
                                onClick={() => handleDelete(alarm.id)}
                              />
                            </HStack>
                          </Flex>
                        </Box>
                      </MotionBox>
                    ))}
                  </AnimatePresence>
                </VStack>
              )}
            </CardBody>
          </Card>

          {/* Market Sessions */}
          <Card bg="gray.800" borderColor="gray.700">
            <CardHeader>
              <Heading size="md" color="green.400">
                <HStack>
                  <Globe size={20} />
                  <Text>Global Markets</Text>
                </HStack>
              </Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={4}>
                {marketSessions.map((session, index) => (
                  <Box
                    key={index}
                    w="full"
                    p={4}
                    bg="gray.700"
                    borderRadius="lg"
                    border="1px"
                    borderColor="gray.600"
                  >
                    <Flex justify="space-between" align="center">
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{session.name}</Text>
                        <Text fontSize="sm" color="gray.400">{session.time} UTC</Text>
                      </VStack>
                      <Badge
                        colorScheme={session.color}
                        variant={session.status === 'Open' ? 'solid' : 'outline'}
                      >
                        {session.status}
                      </Badge>
                    </Flex>
                  </Box>
                ))}
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>

      {/* Create/Edit Alarm Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent bg="gray.800" borderColor="gray.700">
          <ModalHeader color="green.400">
            {editingAlarm ? 'Edit Alarm' : 'Create New Alarm'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel color="gray.300">Alarm Name</FormLabel>
                <Input
                  placeholder="e.g., Market Open Alert"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Time</FormLabel>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                />
              </FormControl>

              <FormControl>
                <FormLabel color="gray.300">Type</FormLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  bg="gray.700"
                  borderColor="gray.600"
                >
                  <option value="time">Time Based</option>
                  <option value="price">Price Alert</option>
                  <option value="news">News Alert</option>
                </Select>
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0" color="gray.300">
                  Enable Sound
                </FormLabel>
                <Switch
                  isChecked={formData.sound}
                  onChange={(e) => setFormData({ ...formData, sound: e.target.checked })}
                  colorScheme="green"
                />
              </FormControl>

              <FormControl display="flex" alignItems="center">
                <FormLabel mb="0" color="gray.300">
                  Enable Alarm
                </FormLabel>
                <Switch
                  isChecked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                  colorScheme="green"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="green" onClick={handleSubmit}>
              {editingAlarm ? 'Update Alarm' : 'Create Alarm'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  )
}

export default App
