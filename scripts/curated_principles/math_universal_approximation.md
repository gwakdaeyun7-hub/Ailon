---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 보편 근사 정리, 존재 정리, 활성화 함수, 은닉층, 너비와 깊이, 표현력, 깊이 분리, 차원의 저주
keywords_en: universal approximation theorem, existence theorem, activation function, hidden layer, width vs depth, expressiveness, depth separation, curse of dimensionality
---
Universal Approximation Theorem - 신경망이 임의의 연속 함수를 원하는 정밀도로 근사할 수 있다는 수학적 보장

## 수학에서의 함수 근사 문제

18세기 이후 수학자들은 복잡한 함수를 단순한 조각들의 합으로 표현하는 문제에 매달렸다. Weierstrass(1885)는 어떤 연속 함수든 다항식으로 원하는 정밀도까지 근사할 수 있음을 증명했고, Fourier(1807)는 주기 함수를 사인과 코사인의 합으로 분해했다. 이 아이디어의 핵심은 동일하다. **충분히 많은 단순한 기저 함수(basis function)를 적절히 조합하면, 복잡한 함수를 얼마든지 정확하게 모방할 수 있다.**

Stone-Weierstrass 정리(1937)는 이를 일반화했다. 특정 대수적 조건을 만족하는 함수 집합은 연속 함수의 보편 근사기(universal approximator)가 된다. 다항식이 근사할 수 있는 것은 다항식이 특별해서가 아니라, 더 일반적인 수학적 구조의 한 사례이기 때문이다. 이 배경이 없으면, 1989년에 신경망이 보편 근사 성질을 가진다는 발견이 왜 의미 있는지 이해하기 어렵다. 근사 자체는 새로운 것이 아니었다. 새로운 것은 신경망이라는 특정 구조가 고차원에서 기존 방법보다 효율적일 수 있다는 점이었다.

## 수학 정리에서 신경망 이론의 기둥으로

1989년은 신경망 이론의 전환점이었다. George Cybenko가 시그모이드 활성화를 사용하는 단일 은닉층 신경망의 보편 근사 성질을 증명했고, 같은 해 Kurt Hornik, Maxwell Stinchcombe, Halbert White가 이를 더 넓은 활성화 함수 범위로 확장했다. 핵심 대응 관계는 다음과 같다.

- 수학의 기저 함수 --> 신경망의 **은닉 뉴런** (각 뉴런이 하나의 기저 함수 역할)
- 기저 함수의 계수 --> **가중치와 편향** (학습 대상 파라미터)
- "충분히 많은" 기저 함수 --> **충분히 넓은** 은닉층 (뉴런 수)
- 근사 정밀도 epsilon --> 목표 오차 한계 (epsilon이 작을수록 더 많은 뉴런 필요)
- 비다항식 활성화 조건 --> 뉴런의 **비선형성** (선형이면 합성해도 선형, 다항식이면 합성해도 다항식)

Cybenko의 증명이 답한 질문은 구체적이다. "시그모이드 뉴런을 충분히 많이 나열하면 임의의 연속 함수를 흉내 낼 수 있는가?" 답은 긍정이었다. 이 결과는 신경망 연구 프로그램 전체의 이론적 정당화가 되었다. "그 구조로 충분히 복잡한 함수를 표현할 수 있는가?"라는 근본 의심에 수학적으로 답한 것이다.

## 정리의 구조와 핵심 메커니즘

정리의 정확한 진술은 다음과 같다.

임의의 연속 함수 f: [0,1]^n -> R과 임의의 epsilon > 0에 대해, 단일 은닉층을 가진 신경망 g가 존재하여 모든 x에 대해 |f(x) - g(x)| < epsilon을 만족한다.

Cybenko의 증명에서 핵심 메커니즘을 단계별로 따라가면 이렇다.

1. 시그모이드 함수 sigma(x) = 1/(1+e^(-x))의 가중치 w를 극단적으로 키우면, sigma(wx + b)가 **계단 함수(step function)**에 수렴한다. w가 100이면 완만한 S자 곡선이지만, w가 10000이면 거의 수직으로 0에서 1로 뛰는 계단이 된다
2. 두 계단 함수의 차이로 특정 구간에서만 값이 1인 **직사각형 펄스**를 만들 수 있다
3. 이런 펄스들의 높이와 위치를 조절하여 합산하면, 어떤 연속 함수든 **계단식으로 밑에서부터 쌓아 올릴** 수 있다
4. 펄스의 폭을 줄이고 개수를 늘릴수록 근사가 정밀해진다

공간적으로 비유하면 이렇다. 목표 함수의 그래프가 부드러운 산의 능선이라고 하자. 각 뉴런은 특정 위치에 특정 높이로 세운 직사각형 벽돌이다. 벽돌을 충분히 좁게, 충분히 많이 쌓으면 어떤 능선이든 아래에서 빈틈없이 채울 수 있다. 벽돌이 좁을수록 능선의 굴곡을 더 정밀하게 따라간다.

Leshno et al.(1993)은 결정적 확장을 이루었다. 활성화 함수가 **다항식이 아닌 한**(non-polynomial), 보편 근사 성질이 성립한다. 왜 다항식은 안 되는가? n차 다항식의 합은 여전히 다항식이기 때문이다. 다항식 뉴런을 아무리 많이 나열해도 다항식 함수 밖으로 나갈 수 없다. 이것이 ReLU(max(0, x)), tanh, swish 등 비다항식 활성화가 모두 보편 근사기인 이유이며, 동시에 비선형성의 "올바른 종류"가 왜 중요한지를 보여준다.

## 존재 정리와 구성 정리: 핵심 트레이드오프

보편 근사 정리의 가장 중요한 특성은 이것이 **존재 정리**(existence theorem)이지 **구성 정리**(construction theorem)가 아니라는 점이다. 이 구분은 정리를 올바르게 이해하는 데 결정적이다.

존재 정리는 "그러한 대상이 존재한다"만 말하고, 구성 정리는 "이렇게 만들 수 있다"를 알려준다. 비유하자면, "서울에서 부산까지 도보로 갈 수 있다"는 존재 증명이다. 경로, 소요 시간, 필요한 체력은 알려주지 않는다. 다시 말해, 최적의 가중치가 파라미터 공간 어딘가에 존재한다는 것과 경사하강법이 그 가중치를 실제로 찾아낼 수 있다는 것은 완전히 다른 문제다. 집이 존재한다는 것을 아는 것과 그 집을 찾아갈 수 있는 것은 다르다. 보편 근사 정리가 침묵하는 네 가지 핵심 질문이 있다.

- **뉴런이 몇 개 필요한가?** 정리는 유한 개면 충분하다고만 한다. 일반적인 경우, 입력 차원이 d일 때 정밀도 epsilon을 달성하는 데 필요한 뉴런 수가 (1/epsilon)^d에 비례할 수 있다. d=10, epsilon=0.01이면 10^20개 -- 현실적으로 불가능한 숫자다. Barron(1993)은 특정 부드러움 조건(spectral norm이 유한)하에서 뉴런 수 N에 대해 근사 오차가 O(1/sqrt(N))로 줄어듦을 보였지만, 이 조건을 만족하지 않는 함수에서는 바운드가 적용되지 않는다
- **경사하강법(SGD)이 최적 가중치를 찾을 수 있는가?** 최적 가중치가 존재한다는 것과 SGD가 그것에 도달한다는 것은 전혀 별개다. 손실 함수의 지형이 비볼록(non-convex)이므로 지역 최솟값에 갇힐 수 있다. 2층 ReLU 네트워크의 최적 가중치를 찾는 것조차 NP-hard임이 알려져 있다(Blum & Rivest, 1992)
- **학습 데이터 바깥에서 작동하는가?** 정리는 일반화(generalization)에 대해 아무것도 말하지 않는다. 1000개 학습 데이터로 완벽히 근사해도, 1001번째 입력에서의 성능은 보장되지 않는다. PAC 학습 이론, VC 차원 등 별도의 이론 틀이 필요하다
- **계산 비용이 감당 가능한가?** 이론적 가능성과 실용적 가능성은 별개다. 100차원 입력의 복잡한 함수를 근사하는 데 우주의 원자 수(약 10^80)보다 많은 뉴런이 필요할 수도 있다

이 네 질문은 보편 근사 정리 이후 신경망 이론이 풀어야 했던 핵심 과제들이며, 각각이 별도의 연구 프로그램을 만들어냈다.

## 너비 대 깊이: 이론과 실전의 괴리

보편 근사 정리는 단일 은닉층(넓은 네트워크)이면 충분하다고 하지만, 현대 딥러닝에서 실제로 쓰이는 것은 깊은 네트워크다. 이 괴리의 원인은 **표현 효율성**이다.

Telgarsky(2016)는 깊이 분리(depth separation) 정리를 증명했다. k개의 레이어로 O(k^3)개의 뉴런으로 표현할 수 있는 함수가, 단 2개의 레이어로 표현하려면 2^(k)개에 비례하는 뉴런이 필요하다. 직관적으로, 깊은 네트워크는 함수의 **합성**(composition)을 통해 계층적 구조를 표현한다. "코에서 눈으로, 눈에서 얼굴로"처럼, 저수준 패턴을 조합하여 고수준 패턴을 만드는 과정을 레이어가 대행한다. 같은 복잡도의 함수를 넓은 1층 네트워크로 표현하면, 이 계층 구조를 한 층에 평탄하게 펼쳐야 하므로 뉴런이 기하급수적으로 필요해진다.

Lu et al.(2017)은 정밀한 경계를 추가했다. ReLU 네트워크에서 너비가 입력 차원 n + 1 이상이면 보편 근사기이고, n 이하이면 근사 불가능한 연속 함수가 존재한다. 즉 n + 1이 최소 너비의 임계값이다.

그러나 깊은 네트워크의 이론적 이점은 학습 가능성이 뒷받침되지 않으면 무용하다. 50층, 100층 네트워크에서는 기울기 소실(vanishing gradient)로 학습 자체가 불가능했다. He et al.(2015)의 ResNet이 **잔차 연결**(skip connection)로 이 벽을 돌파했고, 그제서야 깊이의 이론적 이점이 실제로 활용 가능해졌다.

## 현대 AI와의 연결

보편 근사 정리의 영향은 직접적 이론 적용과 간접적 구조 유사성으로 나뉜다.

**직접적 이론 토대:**

- **신경망 연구 프로그램의 정당화**: 보편 근사 정리는 "신경망 구조가 충분한 표현력을 가지는가?"라는 근본 질문에 수학적으로 답했다. 이 답이 없었다면, 1990년대 신경망 겨울(neural network winter)에 연구 프로그램 자체가 포기되었을 가능성이 있다. 정리는 "원리적으로 가능하다"는 최소한의 이론적 보증을 제공했다
- **활성화 함수 설계의 이론적 근거**: Leshno et al.(1993)의 확장은 "비다항식이면 된다"는 명확한 기준을 세웠다. 이것이 ReLU(Nair & Hinton, 2010), Leaky ReLU, GELU, Swish 등 다양한 활성화 함수 실험의 이론적 안전망이 되었다. 새 활성화 함수가 비다항식이기만 하면, 적어도 표현력을 잃지는 않는다는 보장이 있었기 때문이다
- **너비-깊이 트레이드오프 연구**: Telgarsky(2016), Lu et al.(2017)의 깊이 분리 결과는 보편 근사 정리를 출발점으로, "이론적 가능성"에서 "실용적 효율성"으로 질문을 전환시켰다

**구조적 유사성(동일 직관의 독립적 공유):**

- **과파라미터화(overparameterization)와 이중 하강(double descent)**: Belkin et al.(2019)가 보고한 이중 하강 현상 -- 파라미터가 데이터보다 훨씬 많은 모델이 오히려 잘 일반화하는 현상 -- 은 보편 근사 정리의 범위를 완전히 벗어난다. 정리는 "충분히 많은 뉴런으로 근사 가능"만 말하지, "필요 이상으로 많은 뉴런이 왜 해롭지 않은가"는 다루지 않는다. 이 현상은 고전 통계학의 편향-분산 트레이드오프에도 정면으로 모순되며, 별도의 이론 틀(보간 이론, 암묵적 정규화)이 필요하다
- **Transformer의 보편 근사 성질**: Yun et al.(2020)은 Transformer 아키텍처도 보편 근사기임을 증명했다. 그러나 Transformer의 실제 성공 이유는 근사 능력이 아니라 self-attention의 귀납적 편향(inductive bias)이 자연어의 장거리 의존성 구조와 맞아떨어진다는 점에 있다

## 한계와 약점

- **학습 불가능성**: 정리는 최적 가중치의 존재만 보장한다. SGD나 Adam이 그 가중치에 도달할 수 있는지는 별개의 문제이며, 비볼록 최적화의 일반론에서 보장되지 않는다. NP-hard 최적화 문제를 포함하여, 이론적으로 근사 가능하지만 실제로 학습 불가능한 경우가 존재한다
- **뉴런 수의 폭발**: 일반적인 연속 함수에 대해 필요한 뉴런 수가 입력 차원 n에 대해 기하급수적으로 증가할 수 있다. Barron(1993)의 O(1/sqrt(N)) 바운드는 spectral norm이 유한한 함수에만 적용되며, 이 조건 밖에서는 차원의 저주를 피할 수 없다
- **불연속 함수 제외**: 정리는 연속 함수만 다룬다. 분류 문제의 결정 경계(decision boundary)는 불연속인 경우가 많으며, 실제로는 시그모이드나 softmax의 연속 출력을 임계값으로 이산화하여 분류에 사용하지만, 이는 정리의 직접적 결과가 아니다
- **현대 아키텍처 설명 실패**: CNN, Transformer, GNN 등 현대 아키텍처의 성공 이유를 이 정리로 설명할 수 없다. 이들의 성공은 아키텍처의 귀납적 편향이 데이터의 구조적 규칙성(국소성, 계층성, 순열 불변성)과 정합하기 때문이며, 단순한 근사 능력과는 별개의 문제다

## 용어 정리

보편 근사 정리(universal approximation theorem) - 충분히 넓은 단일 은닉층 신경망이 컴팩트 집합 위의 임의의 연속 함수를 원하는 정밀도로 근사할 수 있다는 정리

존재 정리(existence theorem) - 특정 성질을 가진 수학적 대상이 존재함을 증명하는 정리. 대상을 어떻게 만드는지는 알려주지 않음

기저 함수(basis function) - 복잡한 함수를 표현하기 위해 선형 결합되는 단순한 함수. 다항식, 사인/코사인, 시그모이드 뉴런 등이 해당

시그모이드(sigmoid) - sigma(x) = 1/(1+e^(-x)) 형태의 S자형 함수. Cybenko 원래 증명의 기반이 된 활성화 함수

깊이 분리(depth separation) - 깊은 네트워크가 얕은 네트워크보다 기하급수적으로 적은 뉴런으로 특정 함수를 표현할 수 있다는 이론적 결과

차원의 저주(curse of dimensionality) - 입력 차원이 증가할 때 필요한 데이터나 계산 자원이 기하급수적으로 증가하는 현상

귀납적 편향(inductive bias) - 학습 알고리즘이나 아키텍처가 특정 유형의 해를 선호하도록 내재된 구조적 가정. CNN의 국소성, Transformer의 attention 등

과파라미터화(overparameterization) - 모델의 학습 가능 파라미터 수가 학습 데이터 수를 크게 초과하는 상태. 고전 이론의 예측과 달리 과적합이 아닌 일반화로 이어지는 경우가 관찰됨

이중 하강(double descent) - 모델 복잡도 증가 시 테스트 오류가 U자로 증가했다가, 보간 임계점을 지나면 다시 감소하는 현상. 고전적 편향-분산 트레이드오프의 예측에 정면으로 반함

잔차 연결(skip connection) - 레이어의 입력을 출력에 직접 더하는 구조. 기울기 소실 문제를 완화하여 100층 이상의 깊은 네트워크 학습을 가능하게 함
---EN---
Universal Approximation Theorem - A mathematical guarantee that neural networks can approximate any continuous function to arbitrary precision

## The Function Approximation Problem in Mathematics

Since the 18th century, mathematicians worked on expressing complex functions as sums of simpler pieces. Weierstrass (1885) proved that any continuous function can be approximated to arbitrary precision by polynomials, and Fourier (1807) decomposed periodic functions into sums of sines and cosines. The core idea is the same: **combine sufficiently many simple basis functions with the right coefficients, and you can mimic any complex function to any desired accuracy.**

The Stone-Weierstrass theorem (1937) generalized this. Any set of functions satisfying certain algebraic conditions becomes a universal approximator of continuous functions. Polynomials can approximate not because they are special, but because they are one instance of a more general mathematical structure. Without this background, it is hard to appreciate why the 1989 discovery that neural networks possess the universal approximation property was significant. Approximation itself was not new. What was new was that the specific structure of neural networks might be more efficient than existing methods in high dimensions.

## From Mathematical Theorem to Pillar of Neural Network Theory

1989 was a turning point for neural network theory. George Cybenko proved the universal approximation property for single hidden layer networks with sigmoid activation, and in the same year Kurt Hornik, Maxwell Stinchcombe, and Halbert White extended the result to a broader class of activation functions. The key correspondences are:

- Basis functions in mathematics --> **hidden neurons** in neural networks (each neuron acts as one basis function)
- Coefficients of basis functions --> **weights and biases** (learnable parameters)
- "Sufficiently many" basis functions --> a **sufficiently wide** hidden layer (number of neurons)
- Approximation precision epsilon --> target error bound (smaller epsilon requires more neurons)
- Non-polynomial activation requirement --> the neuron's **nonlinearity** (linear compositions remain linear; polynomial compositions remain polynomial)

The question Cybenko's proof answered is specific: "Can sufficiently many sigmoid neurons approximate any continuous function?" The answer was yes. This result served as theoretical justification for the entire neural network research program -- a mathematical answer to the fundamental doubt: "Can that structure represent sufficiently complex functions?"

## Structure of the Theorem and Core Mechanism

The precise statement of the theorem is:

For any continuous function f: [0,1]^n -> R and any epsilon > 0, there exists a neural network g with a single hidden layer such that |f(x) - g(x)| < epsilon for all x.

Following the core mechanism of Cybenko's proof step by step:

1. When the weight w of the sigmoid function sigma(x) = 1/(1+e^(-x)) is made extremely large, sigma(wx + b) converges to a **step function**. At w = 100, it is a gentle S-curve, but at w = 10000, it jumps almost vertically from 0 to 1
2. The difference of two step functions creates a **rectangular pulse** that equals 1 only within a specific interval
3. By adjusting the heights and positions of such pulses and summing them, any continuous function can be **built up step-by-step from below**
4. Narrower and more numerous pulses yield a finer approximation

To visualize this spatially: imagine the target function's graph as the smooth ridgeline of a mountain. Each neuron is a rectangular brick placed at a specific position with a specific height. Stack enough sufficiently narrow bricks, and you can fill in any ridgeline from below without gaps. The narrower the bricks, the more precisely they follow every contour of the ridge.

Leshno et al. (1993) achieved a decisive extension: the universal approximation property holds as long as the activation function is **non-polynomial**. Why are polynomials excluded? Because the sum of n-th degree polynomials is still a polynomial. No matter how many polynomial neurons you line up, you cannot escape the space of polynomial functions. This is why ReLU (max(0, x)), tanh, swish, and other non-polynomial activations are all universal approximators, and why the "right kind" of nonlinearity matters.

## Existence vs. Construction: The Core Tradeoff

The most important characteristic of the universal approximation theorem is that it is an **existence theorem**, not a **construction theorem**. This distinction is critical to understanding the theorem correctly.

An existence theorem says only "such an object exists"; a construction theorem tells you "how to build it." By analogy, "you can walk from Seoul to Busan" is an existence proof. It says nothing about the route, the time required, or the physical stamina needed. In other words, the existence of optimal weights somewhere in parameter space is an entirely different matter from whether gradient descent can actually find them. Knowing a house exists is not the same as being able to find it. The theorem is silent on four critical questions:

- **How many neurons are needed?** The theorem says only that a finite number suffices. In the general case, the number of neurons needed to achieve precision epsilon with input dimension d can scale as (1/epsilon)^d. For d=10 and epsilon=0.01, that is 10^20 -- a practically impossible number. Barron (1993) showed that for functions satisfying a specific smoothness condition (finite spectral norm), approximation error decreases as O(1/sqrt(N)) with neuron count N, but this bound does not apply outside that condition
- **Can gradient descent (SGD) find the optimal weights?** The existence of an optimal weight configuration and SGD's ability to reach it are entirely different matters. The loss landscape is non-convex, so the optimizer may get trapped in local minima. Even finding optimal weights for a 2-layer ReLU network is known to be NP-hard (Blum & Rivest, 1992)
- **Does the approximation generalize beyond training data?** The theorem says nothing about generalization. Even a perfect approximation from 1,000 training examples guarantees nothing about the 1,001st input. Separate theoretical frameworks such as PAC learning theory and VC dimension are required
- **Is the computational cost feasible?** Theoretical possibility and practical feasibility are separate concerns. Approximating a complex function with 100-dimensional input might require more neurons than there are atoms in the universe (roughly 10^80)

These four questions became the core challenges for neural network theory after the universal approximation theorem, each spawning its own research program.

## Width vs. Depth: The Gap Between Theory and Practice

The universal approximation theorem says a single hidden layer (wide network) suffices, yet modern deep learning overwhelmingly uses deep networks. The root cause of this gap is **representational efficiency**.

Telgarsky (2016) proved a depth separation theorem: functions expressible with k layers using O(k^3) neurons require on the order of 2^(k) neurons with just 2 layers. Intuitively, deep networks express **hierarchical structure** through function **composition**. "From edges to eyes, from eyes to faces" -- layers chain low-level patterns into high-level ones. Representing the same function with a wide single-layer network requires flattening this hierarchy into one layer, demanding exponentially more neurons.

Lu et al. (2017) added precise boundaries. For ReLU networks, width at least n + 1 (where n is input dimension) guarantees universal approximation; at width n or less, there exist continuous functions that cannot be approximated. That is, n + 1 is the critical minimum width threshold.

However, the theoretical advantage of depth is useless without learnability. In networks with 50 or 100 layers, vanishing gradients made training practically impossible. He et al.'s (2015) ResNet broke through this wall with **skip connections**, and only then could the theoretical depth advantage be realized in practice.

## Connections to Modern AI

The influence of the universal approximation theorem divides into direct theoretical applications and indirect structural similarities.

**Direct theoretical foundation:**

- **Justification for the neural network research program**: The theorem mathematically answered "does the neural network structure have sufficient expressive power?" Without this answer, the research program itself might have been abandoned during the 1990s neural network winter. The theorem provided the minimal theoretical assurance that the approach was "possible in principle"
- **Theoretical basis for activation function design**: Leshno et al.'s (1993) extension established the clear criterion "non-polynomial suffices." This became the theoretical safety net for experiments with ReLU (Nair & Hinton, 2010), Leaky ReLU, GELU, Swish, and others. As long as a new activation was non-polynomial, researchers had a guarantee that expressiveness would not be lost
- **Width-depth tradeoff research**: The depth separation results of Telgarsky (2016) and Lu et al. (2017), using the universal approximation theorem as their starting point, shifted the question from "theoretical possibility" to "practical efficiency"

**Structural similarities (same intuition, independently shared):**

- **Overparameterization and double descent**: The double descent phenomenon reported by Belkin et al. (2019) -- where models with far more parameters than data generalize surprisingly well -- lies entirely outside the theorem's scope. The theorem says "enough neurons can approximate" but does not address "why too many neurons are not harmful." This phenomenon also directly contradicts classical bias-variance tradeoff, requiring separate theoretical frameworks (interpolation theory, implicit regularization)
- **Universal approximation of Transformers**: Yun et al. (2020) proved that the Transformer architecture is also a universal approximator. However, Transformers' actual success comes not from approximation capability but from self-attention's inductive bias aligning with the long-range dependency structure of natural language

## Limitations and Weaknesses

- **Unlearnability**: The theorem guarantees only the existence of optimal weights. Whether SGD or Adam can reach them is a separate problem not guaranteed by general non-convex optimization theory. There exist problems that are theoretically approximable but practically unlearnable, including NP-hard optimization problems
- **Exponential neuron growth**: For general continuous functions, the required number of neurons may grow exponentially with input dimension n. Barron's (1993) O(1/sqrt(N)) bound applies only to functions with finite spectral norm; outside this condition, the curse of dimensionality cannot be avoided
- **Exclusion of discontinuous functions**: The theorem covers only continuous functions. Decision boundaries in classification problems are often discontinuous. In practice, continuous outputs from sigmoid or softmax are thresholded for classification, but this is not a direct consequence of the theorem
- **Failure to explain modern architectures**: The success of CNNs, Transformers, and GNNs cannot be explained by this theorem. Their success stems from alignment between architectural inductive biases and structural regularities in data (locality, hierarchy, permutation invariance) -- a matter separate from mere approximation capability

## Glossary

Universal approximation theorem - a theorem proving that a sufficiently wide single hidden layer neural network can approximate any continuous function on a compact set to arbitrary precision

Existence theorem - a theorem proving that a mathematical object with specific properties exists, without providing a method for constructing it

Basis function - a simple function that is linearly combined to represent complex functions; examples include polynomials, sine/cosine functions, and sigmoid neurons

Sigmoid - an S-shaped function of the form sigma(x) = 1/(1+e^(-x)); the activation function underlying Cybenko's original proof

Depth separation - a theoretical result showing that deep networks can represent certain functions with exponentially fewer neurons than shallow networks

Curse of dimensionality - the phenomenon where required data or computational resources grow exponentially as input dimension increases

Inductive bias - structural assumptions inherent in a learning algorithm or architecture that favor certain types of solutions; examples include locality in CNNs and attention in Transformers

Overparameterization - a state where the number of learnable parameters greatly exceeds the number of training data points; contrary to classical predictions, this can lead to generalization rather than overfitting

Double descent - a phenomenon where test error increases in a U-shape as model complexity grows, then decreases again past the interpolation threshold, directly contradicting the classical bias-variance tradeoff prediction

Skip connection - a structure that directly adds a layer's input to its output, mitigating vanishing gradients and enabling training of networks with 100+ layers