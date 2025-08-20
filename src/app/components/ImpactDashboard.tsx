"use client"
import { FlagIcon as Flag2, FlagIcon as Government, Users, Earth } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState, useRef } from "react"

// Import ECharts dynamically on client side
import dynamic from "next/dynamic"
const EChartsReact = dynamic(() => import("echarts-for-react"), { ssr: false })

export default function ImpactDashboard() {
  // State to track if section is visible
  const [isVisible, setIsVisible] = useState(false);
  
  // Refs for the dashboard and animation values
  const dashboardRef = useRef<HTMLDivElement>(null);
  const reportsRef = useRef<HTMLHeadingElement>(null);
  const casesRef = useRef<HTMLHeadingElement>(null);
  const volunteersRef = useRef<HTMLHeadingElement>(null);
  const hectaresRef = useRef<HTMLHeadingElement>(null);
  
  // Target values for animation
  const targetValues = {
    reports: 1234,
    cases: 892,
    volunteers: 5678,
    hectares: 3450
  };

  // Animation function for counting up numbers
  const animateValue = (
    elem: HTMLHeadingElement | null,
    start: number,
    end: number,
    duration: number
  ) => {
    if (!elem) return;
    
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      const currentValue = Math.floor(progress * (end - start) + start);
      elem.textContent = currentValue.toLocaleString();
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  };
  
  // Set up Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        root: null,
        threshold: 0.1, // Trigger when 10% of the dashboard is visible
      }
    );
    
    if (dashboardRef.current) {
      observer.observe(dashboardRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Animate the numbers when section becomes visible
  useEffect(() => {
    if (isVisible) {
      animateValue(reportsRef.current, 0, targetValues.reports, 2000);
      animateValue(casesRef.current, 0, targetValues.cases, 2000);
      animateValue(volunteersRef.current, 0, targetValues.volunteers, 2000);
      animateValue(hectaresRef.current, 0, targetValues.hectares, 2000);
    }
  }, [isVisible]);

  return (
    <section ref={dashboardRef} className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Real-Time Impact Dashboard</h2>
          <p className="text-base text-gray-600 max-w-3xl mx-auto">
            Track our progress in protecting Ghana's environment through live monitoring and community action
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className={`transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} 
                style={{ transitionDelay: '100ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-green-100 text-green-600 rounded-full">
                  <Flag2 className="h-5 w-5" />
                </div>
                <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-full">↑ 12% this month</span>
              </div>
              <h3 ref={reportsRef} className="text-2xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-600">Reports Submitted</p>
            </CardContent>
          </Card>
          <Card className={`transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: '200ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full">
                  <Government className="h-5 w-5" />
                </div>
                <span className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded-full">↑ 8% this month</span>
              </div>
              <h3 ref={casesRef} className="text-2xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-600">Cases Resolved</p>
            </CardContent>
          </Card>
          <Card className={`transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: '300ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-sm text-purple-600 bg-purple-50 px-2 py-1 rounded-full">↑ 15% this month</span>
              </div>
              <h3 ref={volunteersRef} className="text-2xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-600">Active Volunteers</p>
            </CardContent>
          </Card>
          <Card className={`transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: '400ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-full">
                  <Earth className="h-5 w-5" />
                </div>
                <span className="text-sm text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">↑ 20% this month</span>
              </div>
              <h3 ref={hectaresRef} className="text-2xl font-bold text-gray-900 mb-1">0</h3>
              <p className="text-sm text-gray-600">Hectares Protected</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={`transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: '500ms' }}>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-4">Monthly Report Submissions</h3>
              <div className="h-56">
                <MonthlyReportsChart isVisible={isVisible} />
              </div>
            </CardContent>
          </Card>
          <Card className={`transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                style={{ transitionDelay: '600ms' }}>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-4">Environmental Recovery Progress</h3>
              <div className="h-56">
                <RecoveryProgressChart isVisible={isVisible} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}

function MonthlyReportsChart({ isVisible }: { isVisible: boolean }) {
  const [animated, setAnimated] = useState(false);
  const chartInstanceRef = useRef<any>(null);
  
  // Base chart options
  const baseOption = {
    animation: true,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderColor: "#ddd",
      borderWidth: 1,
      textStyle: {
        color: "#1f2937",
      },
    },
    grid: {
      top: "8px",
      right: "10px",
      bottom: "20px",
      left: "28px",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      axisLine: {
        lineStyle: {
          color: "#ddd",
        },
      },
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "#ddd",
        },
      },
      splitLine: {
        lineStyle: {
          color: "#f0f0f0",
        },
      },
      axisLabel: {
        fontSize: 11
      }
    },
    series: [
      {
        data: isVisible ? [150, 230, 224, 218, 135, 147] : [0, 0, 0, 0, 0, 0],
        type: "bar",
        itemStyle: {
          color: "rgba(87, 181, 231, 1)",
        },
        barWidth: "55%",
        emphasis: {
          itemStyle: {
            color: "rgba(87, 181, 231, 0.8)",
          },
        },
        animationDelay: function (idx: number) {
          return idx * 100;
        },
        animationDuration: 1500
      },
    ],
  };

  // Update chart when it becomes visible
  useEffect(() => {
    if (isVisible && !animated && chartInstanceRef.current) {
      setAnimated(true);
      
      // Force re-render for animation
      const instance = chartInstanceRef.current;
      if (instance) {
        instance.setOption({
          series: [
            {
              data: [150, 230, 224, 218, 135, 147]
            }
          ]
        });
      }
    }
  }, [isVisible, animated]);

  return <EChartsReact 
    option={baseOption} 
    style={{ height: "100%", width: "100%" }} 
    onEvents={{
      'rendered': (e: any) => {
        chartInstanceRef.current = e.getEchartsInstance();
      }
    }}
  />
}

function RecoveryProgressChart({ isVisible }: { isVisible: boolean }) {
  const [animated, setAnimated] = useState(false);
  const chartInstanceRef = useRef<any>(null);
  
  // Base chart options
  const baseOption = {
    animation: true,
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.8)",
      borderColor: "#ddd",
      borderWidth: 1,
      textStyle: {
        color: "#1f2937",
      },
    },
    grid: {
      top: "8px",
      right: "10px",
      bottom: "20px",
      left: "28px",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      axisLine: {
        lineStyle: {
          color: "#ddd",
        },
      },
      axisLabel: {
        fontSize: 11
      }
    },
    yAxis: {
      type: "value",
      axisLine: {
        lineStyle: {
          color: "#ddd",
        },
      },
      splitLine: {
        lineStyle: {
          color: "#f0f0f0",
        },
      },
      axisLabel: {
        fontSize: 11
      }
    },
    series: [
      {
        data: isVisible ? [820, 932, 901, 934, 1290, 1330] : [0, 0, 0, 0, 0, 0],
        type: "line",
        smooth: true,
        lineStyle: {
          width: 3,
          color: "rgba(141, 211, 199, 1)",
        },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              {
                offset: 0,
                color: "rgba(141, 211, 199, 0.2)",
              },
              {
                offset: 1,
                color: "rgba(141, 211, 199, 0.05)",
              },
            ],
          },
        },
        symbol: "none",
        animationDelay: function (idx: number) {
          return idx * 100;
        },
        animationDuration: 1500
      },
    ],
  };

  // Update chart when it becomes visible
  useEffect(() => {
    if (isVisible && !animated && chartInstanceRef.current) {
      setAnimated(true);
      
      // Force re-render for animation
      const instance = chartInstanceRef.current;
      if (instance) {
        instance.setOption({
          series: [
            {
              data: [820, 932, 901, 934, 1290, 1330]
            }
          ]
        });
      }
    }
  }, [isVisible, animated]);

  return <EChartsReact 
    option={baseOption} 
    style={{ height: "100%", width: "100%" }} 
    onEvents={{
      'rendered': (e: any) => {
        chartInstanceRef.current = e.getEchartsInstance();
      }
    }}
  />
}
