"""
Sample Python file for upload testing
This file is used to test .py file upload functionality
"""

class DataProcessor:
    """Process and analyze data"""

    def __init__(self):
        self.data = []

    def add_data(self, item):
        """Add an item to the data collection"""
        self.data.append(item)

    def get_average(self):
        """Calculate the average of numeric data"""
        if not self.data:
            return 0
        return sum(self.data) / len(self.data)

    def get_max(self):
        """Get the maximum value"""
        if not self.data:
            return None
        return max(self.data)

def fibonacci(n):
    """Generate Fibonacci sequence up to n terms"""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]

    sequence = [0, 1]
    for i in range(2, n):
        sequence.append(sequence[i-1] + sequence[i-2])
    return sequence
