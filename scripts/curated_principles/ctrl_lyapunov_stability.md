---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 리아푸노프 안정성, 에너지 함수, 수렴 보장, 안전 제약, 제어 리아푸노프 함수, 신경 리아푸노프 함수
keywords_en: Lyapunov stability, energy function, convergence guarantee, safety constraint, control Lyapunov function, neural Lyapunov function
---
Lyapunov Stability Theory - 시스템의 에너지가 감소하면 안정적이라는 직관으로 미분방정식을 풀지 않고 안정성을 판별하는 방법

## 안정성이란 무엇인가

그릇 안에 놓인 공을 상상해 보자. 공을 옆으로 살짝 밀면 벽을 따라 흔들리다가 결국 바닥으로 돌아온다. 이것이 **안정(stable)** 시스템이다. 이제 그릇을 뒤집어 놓고 꼭대기에 공을 올려 보자. 아주 작은 바람에도 공은 굴러 떨어지고, 다시는 원래 위치로 돌아오지 않는다. 이것이 **불안정(unstable)** 시스템이다.

제어 이론에서는 안정성을 더 정밀하게 세 단계로 구분한다. 첫째, **안정**: 작은 교란 후에 시스템이 평형점 근처에 머무른다(그릇 속 공이 흔들리지만 바닥 근처에 있음). 둘째, **점근적 안정(asymptotically stable)**: 시간이 충분히 지나면 시스템이 정확히 평형점으로 수렴한다(공이 마찰 때문에 결국 바닥 한가운데에 멈춤). 셋째, **불안정**: 아무리 작은 교란에도 시스템이 평형에서 멀어진다. 엔지니어에게 가장 중요한 것은 점근적 안정이다. 로봇 팔이 목표 각도로 수렴하고, 드론이 지정 고도를 유지하려면, 시스템이 점근적으로 안정해야 한다.

## 리아푸노프의 통찰 -- 해를 구하지 않는 분석

1892년, 러시아 수학자 Aleksandr Lyapunov는 박사 논문 "운동의 안정성 일반 문제에 관하여"에서 혁명적 아이디어를 제시했다. 당시 안정성 분석은 미분방정식의 해를 직접 구한 뒤 시간에 따른 행동을 관찰하는 것이었다. 그러나 대부분의 비선형 시스템은 미분방정식의 해를 구할 수 없다.

리아푸노프의 통찰은 이것이다. **시스템의 "에너지"가 시간에 따라 줄어들면, 시스템은 안정적이다.** 물리 수업을 떠올려 보자. 물체를 높은 곳에서 놓으면 위치 에너지가 운동 에너지로 바뀌고, 마찰로 에너지가 소산되면서 결국 멈춘다. 에너지가 계속 줄어드는 시스템은 반드시 정지 상태에 도달한다. 리아푸노프는 이 물리적 직관을 순수 수학으로 일반화했다. 실제 물리적 에너지가 아니라, 에너지처럼 **행동하는** 수학적 함수를 찾으면 안정성을 증명할 수 있다. 이 함수가 리아푸노프 함수 V(x)다.

## 리아푸노프 직접 방법의 구조

V(x)가 리아푸노프 함수가 되려면 두 가지 조건을 만족해야 한다.

**조건 1: V(x) > 0 (평형점 이외에서 양수), V(0) = 0 (평형점에서 0)**

이것은 V(x)가 "높이" 또는 "에너지"처럼 동작한다는 뜻이다. 평형점이 골짜기의 가장 낮은 점이고, 다른 모든 곳은 그보다 높다. 산악 지형에서 가장 깊은 지점을 0으로 놓고, 주변의 모든 점이 양의 높이를 가지는 것과 같다.

**조건 2: 시간에 따른 변화**

- dV/dt ≤ 0 → 에너지가 증가하지 않으므로 시스템은 **안정**
- dV/dt < 0 (엄격한 감소) → 에너지가 항상 줄어들므로 시스템은 **점근적 안정**

직관적으로 이렇게 상상하면 된다. 언덕 위의 공이 굴러내리는데, 에너지가 **항상** 줄어든다면 공은 결국 골짜기 바닥에 도달할 수밖에 없다. V(x)를 찾으면 미분방정식의 해를 일일이 추적하지 않고도 안정성이 보장된다. 이것이 "직접 방법(direct method)"이라 불리는 이유다.

## 왜 강력한가 -- 그리고 왜 어려운가

이 방법의 위력은 비선형 시스템에서 드러난다. 선형 시스템은 고유값(eigenvalue) 분석으로 안정성을 판별할 수 있지만, 비선형 시스템은 미분방정식의 해를 구하는 것 자체가 대체로 불가능하다. 리아푸노프 방법은 해를 구하지 않고, V(x)라는 "에너지 렌즈"를 통해 시스템의 운명을 내다본다.

그러나 핵심 난점이 있다. **적절한 V(x)를 찾는 것 자체가 예술(art)에 가깝다.** 주어진 시스템에 대해 "이 함수가 리아푸노프 함수다"라고 체계적으로 도출하는 범용 방법이 없다. 간단한 시스템에서는 물리적 에너지(운동 에너지 + 위치 에너지)를 V(x)로 삼을 수 있지만, 복잡한 시스템에서는 후보 함수를 추측하고 조건을 검증하는 시행착오 과정이 필요하다. 이 어려움이 나중에 AI가 개입하는 지점이 된다.

또 하나 중요한 점: 리아푸노프 방법은 **충분 조건이지 필요 조건이 아니다**. 적절한 V(x)를 찾으면 안정성이 보장되지만, V(x)를 못 찾았다고 시스템이 불안정하다고 결론지을 수는 없다. 더 좋은 V(x)가 존재할 수 있기 때문이다.

## AI로의 연결 -- 수학적 기반

리아푸노프 이론이 AI에 연결되는 경로는 크게 세 갈래다. 모두 V(x)의 "에너지 감소 → 수렴 보장"이라는 핵심 구조를 공유한다.

**신경망 학습의 수렴 분석**: 손실 함수 L(w)를 리아푸노프 함수 V(x)로 해석할 수 있다. 가중치 w가 학습 과정에서 변할 때 L(w)가 단조 감소하면, 마치 에너지가 줄어드는 시스템처럼 학습이 수렴한다는 보장이 된다. 확률적 경사하강법(SGD)의 수렴 증명에서 리아푸노프 방법이 핵심 도구로 활용된다. 다만 SGD는 미니배치의 확률적 잡음 때문에 매 스텝마다 엄밀히 dV/dt < 0이 성립하지 않으므로, 이 조건을 기댓값 형태로 완화하여 적용한다.

**안전한 강화학습(Safe RL)**: 로봇이 장애물을 피하면서 목표에 도달해야 할 때, "어떤 상황에서도 충돌하지 않는다"는 보장이 필요하다. **제어 리아푸노프 함수(Control Lyapunov Function, CLF)**는 시스템을 목표로 수렴시키는 제어 입력이 항상 존재함을 보장한다. 여기에 **제어 장벽 함수(Control Barrier Function, CBF)**를 결합하면, "목표로 수렴하면서도 안전 영역을 벗어나지 않는" 제어가 가능하다. CLF가 "목표에 도달한다"를 보장하고, CBF가 "위험 구역에 들어가지 않는다"를 보장하는 이중 안전장치다.

**신경 리아푸노프 함수(Neural Lyapunov Function)**: 인간이 설계하기 어려운 V(x)를 신경망으로 학습하는 접근이다. Chang et al.(2019)은 학습기(learner)와 검증기(verifier)의 반복 구조를 제안했다. 학습기가 V(x)를 근사하는 신경망을 훈련하면, 검증기가 V(x) > 0과 dV/dt < 0 조건을 위반하는 반례를 찾는다. 반례가 발견되면 학습 데이터에 추가하여 재훈련한다. 이 과정을 반례가 더 이상 발견되지 않을 때까지 반복한다. 전통적으로 전문가의 직관에 의존했던 V(x) 설계를 자동화한 것이다.

## 한계와 약점

- **V(x) 찾기의 어려움**: 고차원 시스템에서 적절한 V(x)를 찾는 것은 극도로 어렵다. 상태 변수가 수백 개인 시스템에서는 직관적 추측이 거의 불가능하다.
- **충분 조건의 한계**: V(x)를 못 찾았다고 시스템이 불안정한 것이 아니다. 더 나은 V(x)가 존재할 수 있으므로, 이 방법은 안정성을 증명할 수는 있어도 불안정성을 증명하기는 어렵다.
- **국소 분석의 제약**: 리아푸노프 함수가 유효한 영역이 평형점 근처에 국한될 수 있다. 전역적 안정성을 보장하려면 V(x)가 전체 상태 공간에서 조건을 만족해야 하며, 이는 훨씬 더 어렵다.
- **신경 리아푸노프의 검증 한계**: 신경망으로 학습한 V(x)는 유한한 점에서만 검증되므로, 수학적 완전성이 보장되지 않는다. 연속 공간 전체에서의 조건 만족을 입증하는 것은 여전히 열린 문제다.

## 용어 정리

리아푸노프 함수(Lyapunov function) - 에너지처럼 행동하는 수학적 함수. 평형점에서 0이고, 다른 곳에서 양수이며, 시간에 따라 감소하면 시스템의 안정성을 보장

점근적 안정성(asymptotic stability) - 교란 후 시스템이 시간이 지남에 따라 정확히 평형점으로 수렴하는 성질

평형점(equilibrium point) - 외부 입력 없이 시스템이 머무르는 상태. 공이 그릇 바닥에 정지해 있는 것에 해당

제어 리아푸노프 함수(control Lyapunov function, CLF) - 시스템을 목표 상태로 수렴시킬 수 있는 제어 입력이 항상 존재함을 보장하는 함수

제어 장벽 함수(control barrier function, CBF) - 시스템이 안전하지 않은 영역에 진입하지 않도록 보장하는 함수. CLF와 결합하여 "수렴 + 안전" 동시 보장

신경 리아푸노프 함수(neural Lyapunov function) - 리아푸노프 함수를 신경망으로 학습하는 방법. 학습기-검증기 반복 구조로 V(x)를 자동 발견. Chang et al.(2019)

에너지 함수(energy function) - 시스템의 상태를 하나의 스칼라 값으로 요약하는 함수. 리아푸노프 함수는 물리적 에너지가 아닌, 에너지와 유사한 수학적 구성물

---EN---
Lyapunov Stability Theory - A method for determining stability through the intuition that decreasing system energy implies stability, without solving differential equations

## What Is Stability

Imagine a ball inside a bowl. Push it sideways and it oscillates along the walls before returning to the bottom. This is a **stable** system. Now flip the bowl upside down and place the ball on top. The slightest breeze sends it rolling off, never to return. This is an **unstable** system.

Control theory distinguishes three levels of stability. First, **stable**: after a small disturbance, the system stays near the equilibrium (the ball wobbles but remains near the bottom). Second, **asymptotically stable**: given enough time, the system converges exactly to the equilibrium (friction eventually brings the ball to a dead stop at the center). Third, **unstable**: any disturbance, no matter how small, drives the system away from equilibrium. For engineers, asymptotic stability matters most. A robot arm converging to its target angle and a drone maintaining altitude both require asymptotic stability.

## Lyapunov's Insight -- Analysis Without Solving

In 1892, Russian mathematician Aleksandr Lyapunov presented a revolutionary idea in his doctoral thesis "On the General Problem of the Stability of Motion." At the time, stability analysis meant directly solving differential equations and observing behavior over time. But most nonlinear systems have no closed-form solution.

Lyapunov's insight: **if a system's "energy" decreases over time, the system is stable.** In physics, an object released from height converts potential energy to kinetic energy, and friction dissipates it until the object stops. A system whose energy keeps decreasing must eventually reach rest. Lyapunov generalized this intuition mathematically. Instead of actual physical energy, finding a mathematical function that **behaves like** energy suffices to prove stability. This function is the Lyapunov function V(x).

## The Structure of Lyapunov's Direct Method

For V(x) to qualify as a Lyapunov function, two conditions must hold.

**Condition 1: V(x) > 0 (positive away from equilibrium), V(0) = 0 (zero at equilibrium)**

This means V(x) acts like "height" or "energy." The equilibrium is the lowest point in a valley, and every other point is higher. Think of a mountain landscape where the deepest point is set to zero and all surrounding points have positive elevation.

**Condition 2: Change over time**

- dV/dt ≤ 0 → energy never increases, so the system is **stable**
- dV/dt < 0 (strictly decreasing) → energy always decreases, so the system is **asymptotically stable**

Visualize it: a ball rolling downhill whose energy **always** decreases must eventually reach the valley floor. Finding V(x) guarantees stability without tracing the differential equation's trajectory step by step. This is why it is called the "direct method."

## Why It Is Powerful -- and Why It Is Hard

The method's power emerges with nonlinear systems. Linear systems can be analyzed via eigenvalues, but solving nonlinear differential equations is generally impossible. The Lyapunov method looks through the "energy lens" of V(x) to foresee the system's fate without solving anything.

Yet a key difficulty remains: **finding a suitable V(x) is closer to art than algorithm.** No general-purpose method exists to systematically derive a Lyapunov function for a given system. For simple systems, physical energy (kinetic + potential) serves as V(x), but complex systems require guessing candidate functions and verifying conditions through trial and error. This difficulty is precisely where AI later enters the picture.

One more critical point: Lyapunov's method provides a **sufficient but not necessary condition**. Finding a valid V(x) guarantees stability, but failing to find one does not prove instability -- a better V(x) may simply exist undiscovered.

## Connections to AI -- Mathematical Foundation

Lyapunov theory connects to AI through three main paths, all sharing V(x)'s core structure of "energy decrease → convergence guarantee."

**Convergence analysis of neural network training**: The loss function L(w) can be interpreted as V(x). If L(w) monotonically decreases during training, convergence is guaranteed. Lyapunov methods serve as a key tool in proving convergence of stochastic gradient descent (SGD). Because SGD's stochastic noise prevents strict dV/dt < 0, the condition is relaxed to hold in expectation.

**Safe reinforcement learning (Safe RL)**: When a robot must reach a goal while avoiding obstacles, guarantees like "never collide under any circumstances" are needed. A **Control Lyapunov Function (CLF)** guarantees that a control input always exists to drive the system toward the goal. Combined with a **Control Barrier Function (CBF)**, control that "converges to the goal while never leaving the safe region" becomes possible. CLF guarantees "will reach the target," CBF guarantees "will not enter the danger zone" -- a dual safety mechanism.

**Neural Lyapunov Functions**: An approach where neural networks learn V(x) that humans find difficult to design. Chang et al. (2019) proposed an iterative learner-verifier structure. The learner trains a neural network approximating V(x), then the verifier searches for counterexamples violating V(x) > 0 or dV/dt < 0. Found counterexamples are added to the training data for retraining. This automates V(x) design that traditionally depended on expert intuition.

## Limitations and Weaknesses

- **Difficulty of finding V(x)**: Finding a suitable V(x) for high-dimensional systems is extremely hard. When state variables number in the hundreds, intuitive guessing becomes virtually impossible.
- **Sufficient condition limitation**: Failure to find V(x) does not mean the system is unstable. A better V(x) may exist, so the method can prove stability but struggles to prove instability.
- **Local analysis constraint**: A Lyapunov function's valid region may be confined near the equilibrium. Global stability requires V(x) to satisfy conditions across the entire state space -- a much harder problem.
- **Verification limits of neural Lyapunov**: A neural-network-learned V(x) is verified only at finitely many points, so mathematical completeness is not guaranteed. Proving condition satisfaction over the entire continuous space remains an open problem.

## Glossary

Lyapunov function - a mathematical function that behaves like energy; zero at the equilibrium, positive elsewhere, and decreasing over time guarantees system stability

Asymptotic stability - the property that a system converges exactly to its equilibrium point over time following a disturbance

Equilibrium point - a state where a system remains without external input; analogous to a ball resting at the bottom of a bowl

Control Lyapunov function (CLF) - a function guaranteeing that a control input always exists to drive the system toward a target state

Control barrier function (CBF) - a function guaranteeing that a system never enters an unsafe region; combined with CLF for simultaneous convergence and safety guarantees

Neural Lyapunov function - a method for learning Lyapunov functions via neural networks; uses an iterative learner-verifier structure to automatically discover V(x). Chang et al. (2019)

Energy function - a function summarizing a system's state as a single scalar value; a Lyapunov function is not physical energy but a mathematical construct that behaves similarly
