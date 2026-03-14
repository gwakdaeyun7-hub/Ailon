---
difficulty: intermediate
connectionType: mathematical_foundation
keywords: 경사하강법, 확률적 경사하강법, 학습률, 미니배치, 모멘텀, 적응적 학습률, 역전파, 비볼록 최적화
keywords_en: gradient descent, stochastic gradient descent, learning rate, mini-batch, momentum, adaptive learning rate, backpropagation, non-convex optimization
---
Gradient Descent and Stochastic Gradient Descent - 함수의 기울기를 따라 반복적으로 내려가며 최솟값을 찾는 최적화의 근본 알고리즘

## 최급강하법의 탄생

경사하강법의 수학적 기원은 Cauchy(1847)의 최급강하법(method of steepest descent)까지 거슬러 올라간다. Cauchy는 천문학 계산에서 연립방정식의 해를 반복적으로 근사하는 방법을 연구하면서, 함수의 그래디언트(gradient) 반대 방향으로 이동하면 함수 값이 가장 빠르게 감소한다는 사실을 이용했다. 핵심 아이디어는 놀랍도록 단순하다. 산에서 가장 빨리 내려가려면 가장 가파른 내리막 방향으로 걸으면 된다. 이 직관이 수학적으로 정식화된 것이 경사하강법이다.

기본 갱신 규칙은 다음과 같다.

theta(t+1) = theta(t) - eta * gradient(L(theta(t)))

여기서 theta는 최적화할 파라미터, eta는 학습률(learning rate), gradient(L)은 손실 함수 L의 그래디언트다. 이 한 줄의 수식이 현대 딥러닝의 모든 학습 과정의 뼈대다.

## 확률적 근사로의 도약

Cauchy의 원래 방법은 전체 데이터에 대한 정확한 그래디언트를 계산한다(배치 경사하강법). 하지만 데이터가 수백만 건이라면? 매 스텝마다 전체를 훑는 것은 비현실적이다.

Robbins & Monro(1951)가 돌파구를 열었다. 이들의 확률적 근사(stochastic approximation) 이론은, 전체 그래디언트 대신 무작위로 선택한 소수의 샘플로 계산한 **노이즈 섞인 추정치**로도 수렴할 수 있음을 증명했다. 핵심 조건은 학습률 수열이 두 가지를 만족하는 것이다. sum(eta_t) = 무한대 (충분히 멀리 이동 가능)이고, sum(eta_t^2) < 무한대 (노이즈가 점차 사라짐)다.

이를 최적화에 적용한 것이 확률적 경사하강법(SGD)이다.

theta(t+1) = theta(t) - eta * gradient_i(L(theta(t)))

gradient_i는 단일 샘플(또는 소규모 미니배치)로 계산한 그래디언트 추정치다. 핵심 성질은 E[gradient_i] = gradient(L), 즉 추정치의 기댓값이 참 그래디언트와 같다는 비편향성(unbiasedness)이다. Kiefer & Wolfowitz(1952)는 이를 함수 최적화에 확장하여 유한차분을 이용한 그래디언트 추정 방법을 제시했다.

## 신경망과의 결합: 역전파

경사하강법이 AI의 핵심 엔진이 된 결정적 계기는 Rumelhart, Hinton & Williams(1986)의 역전파(backpropagation) 논문이다. 다층 신경망에서 각 가중치에 대한 손실 함수의 그래디언트를 **연쇄 법칙(chain rule)**으로 효율적으로 계산할 수 있음을 보여, 경사하강법을 깊은 네트워크 학습에 실용적으로 적용할 수 있게 만들었다.

역전파 자체의 수학적 아이디어는 Linnainmaa(1970)의 자동 미분과 Werbos(1974)의 신경망 적용이 선행했지만, 1986년 논문이 실제 학습 가능성을 설득력 있게 시연하며 분야의 전환점을 만들었다. 경사하강법(최적화 기법) + 역전파(그래디언트 계산법) + 신경망(모델 구조)의 결합이 현대 딥러닝의 삼위일체를 이룬다.

## 모멘텀과 적응적 방법들

순수한 SGD는 노이즈가 크고, 좁은 골짜기 지형에서 수렴이 느리다. 이를 개선하기 위한 연구가 수십 년에 걸쳐 이루어졌다.

Polyak(1964)의 모멘텀(momentum)은 물리학의 관성에서 영감을 받았다. 이전 갱신 방향의 기억을 유지하여 관련 방향으로 가속하고, 진동을 감쇠한다. v(t) = beta * v(t-1) + gradient(L), theta(t+1) = theta(t) - eta * v(t)에서 beta가 관성 계수다. 공이 내리막을 구르며 속도가 붙는 것과 같다.

Nesterov(1983)는 모멘텀에 "미리 보기"를 추가하여 수렴 속도를 이론적으로 개선했다. AdaGrad(Duchi et al., 2011)는 각 파라미터별로 과거 그래디언트 크기를 누적하여 학습률을 자동 조절한다. 자주 갱신되는 파라미터는 학습률을 줄이고, 드물게 갱신되는 파라미터는 학습률을 유지한다. 희소(sparse) 데이터에 효과적이지만, 누적 합이 계속 커져 학습률이 너무 빠르게 감소하는 문제가 있다.

RMSprop(Hinton, 강의 슬라이드 2012)은 AdaGrad의 문제를 지수 이동 평균으로 해결했다. Adam(Kingma & Ba, 2015)은 모멘텀과 RMSprop을 결합하여 1차 모멘트(평균)와 2차 모멘트(분산)를 동시에 추적한다. 바이어스 보정까지 포함한 Adam은 현재 딥러닝에서 가장 널리 쓰이는 옵티마이저다.

## 미니배치: 실용적 절충

실제 딥러닝에서는 순수 SGD(샘플 1개)도, 배치 GD(전체 데이터)도 잘 쓰지 않는다. 미니배치 SGD가 표준이다. 32~512개 샘플로 그래디언트를 추정하는데, 이것이 효과적인 이유가 세 가지다.

첫째, GPU의 병렬 연산을 효율적으로 활용한다. 행렬 연산은 배치 크기가 클수록 하드웨어 활용도가 높다. 둘째, 순수 SGD보다 그래디언트 추정 분산이 줄어 수렴이 안정적이다. 셋째, 그럼에도 약간의 노이즈가 남아 있어 날카로운 지역 최소에 빠지는 것을 방지하는 암묵적 정규화(implicit regularization) 효과가 있다.

## SGD 노이즈의 재발견

SGD의 그래디언트 노이즈는 원래 단점으로 여겨졌지만, 과파라미터화(overparameterized) 시대에 재평가되었다. Smith & Le(2018)는 SGD 노이즈가 학습률/배치크기 비율에 의해 결정되는 "유효 온도"로 작용하며, 이것이 손실 곡면에서 **편평한 최솟값**(flat minima)을 선호하게 한다는 것을 보였다. 편평한 최솟값은 일반화(generalization) 성능과 연관되어 있어, SGD의 "결점"이 사실상 장점이 되는 역설적 상황이다.

Keskar et al.(2017)은 큰 배치가 날카로운 최솟값으로 수렴하여 일반화가 떨어지는 현상을 실험적으로 확인했다. 이는 SGD의 확률적 특성이 단순한 계산 편의를 넘어 학습의 질에 근본적으로 관여함을 보여준다.

## 한계와 약점

경사하강법은 현대 AI의 주력 엔진이지만, 본질적 한계가 뚜렷하다.

- **비볼록 손실 곡면**: 딥러닝의 손실 함수는 극도로 비볼록(non-convex)하다. 전역 최솟값 도달을 보장하는 이론은 없다. Choromanska et al.(2015)은 고차원에서 지역 최솟값보다 안장점(saddle point)이 더 큰 문제라고 지적했다. 안장점에서 그래디언트가 0에 가까워져 학습이 정체된다.
- **학습률 민감성**: eta가 너무 크면 발산하고, 너무 작으면 수렴이 극도로 느리다. 적절한 학습률을 찾는 것 자체가 비자명한 문제로, 학습률 스케줄링(warmup, cosine decay, cyclical learning rates)이 별도 연구 분야를 형성했다.
- **곡률 무시**: 순수 경사하강법은 1차 정보(기울기)만 사용하고 2차 정보(곡률)를 무시한다. 뉴턴법(Newton's method)은 곡률을 사용하여 수렴이 빠르지만, 헤시안(Hessian) 행렬 계산이 O(n^2) 메모리와 O(n^3) 연산을 요구하여 대규모 모델에는 비실용적이다. L-BFGS, K-FAC 등의 근사 2차 방법이 연구되고 있다.
- **그래디언트 소실/폭발**: 깊은 네트워크에서 역전파 시 그래디언트가 곱해지면서 기하급수적으로 작아지거나 커진다. ResNet(He et al., 2015)의 잔차 연결, 배치 정규화(Ioffe & Szegedy, 2015), 그래디언트 클리핑 등의 기법이 이 문제를 완화하지만 근본적으로 해결하지는 못한다.

## 용어 정리

그래디언트(gradient) - 다변수 함수의 각 변수에 대한 편미분을 모은 벡터. 함수가 가장 가파르게 증가하는 방향과 크기를 나타냄

학습률(learning rate) - 각 갱신 스텝에서 그래디언트 방향으로 얼마나 이동할지 결정하는 양의 스칼라 값

확률적 근사(stochastic approximation) - 정확한 값 대신 확률적 추정치를 사용하여 반복적으로 해를 구하는 방법론

미니배치(mini-batch) - 전체 데이터의 부분집합으로, SGD에서 그래디언트 추정에 사용하는 샘플 묶음

모멘텀(momentum) - 이전 갱신 방향의 가중 평균을 유지하여 관련 방향으로 가속하는 기법

안장점(saddle point) - 한 방향으로는 극소, 다른 방향으로는 극대인 점. 고차원 비볼록 함수에서 지역 최소보다 더 빈번히 발생

과파라미터화(overparameterization) - 모델 파라미터 수가 학습 데이터 수보다 훨씬 많은 상태. 현대 딥러닝의 일반적 특징

암묵적 정규화(implicit regularization) - SGD의 노이즈가 명시적 정규화 항 없이도 일반화 성능을 높이는 효과

역전파(backpropagation) - 연쇄 법칙을 이용해 다층 신경망의 각 가중치에 대한 손실 함수의 그래디언트를 효율적으로 계산하는 알고리즘

---EN---
Gradient Descent and Stochastic Gradient Descent - The fundamental optimization algorithm that iteratively follows the slope of a function to find its minimum

## The Birth of Steepest Descent

The mathematical origin of gradient descent traces back to Cauchy's (1847) method of steepest descent. While studying iterative approximation of solutions to systems of equations in astronomical calculations, Cauchy exploited the fact that moving in the direction opposite to the gradient causes the function value to decrease most rapidly. The core idea is remarkably simple: to descend a mountain fastest, walk in the direction of steepest downhill slope. This intuition, formalized mathematically, is gradient descent.

The basic update rule is:

theta(t+1) = theta(t) - eta * gradient(L(theta(t)))

Here theta is the parameter to optimize, eta is the learning rate, and gradient(L) is the gradient of the loss function L. This single formula forms the backbone of all modern deep learning training.

## The Leap to Stochastic Approximation

Cauchy's original method computes the exact gradient over all data (batch gradient descent). But what if there are millions of data points? Scanning everything at each step is impractical.

Robbins & Monro (1951) opened the breakthrough. Their stochastic approximation theory proved that convergence is achievable even with **noisy estimates** computed from randomly selected small subsets instead of the full gradient. The key conditions are that the learning rate sequence satisfies: sum(eta_t) = infinity (able to travel far enough) and sum(eta_t^2) < infinity (noise eventually vanishes).

Applying this to optimization yields stochastic gradient descent (SGD):

theta(t+1) = theta(t) - eta * gradient_i(L(theta(t)))

gradient_i is a gradient estimate from a single sample (or small mini-batch). The crucial property is E[gradient_i] = gradient(L) -- the expected value of the estimate equals the true gradient (unbiasedness). Kiefer & Wolfowitz (1952) extended this to function optimization using finite-difference gradient estimation.

## Union with Neural Networks: Backpropagation

The decisive moment when gradient descent became AI's core engine was Rumelhart, Hinton & Williams' (1986) backpropagation paper. By showing that the gradient of the loss function with respect to each weight in a multi-layer neural network can be efficiently computed via the **chain rule**, they made gradient descent practically applicable to deep network training.

The mathematical idea of backpropagation itself was preceded by Linnainmaa's (1970) automatic differentiation and Werbos' (1974) neural network application, but the 1986 paper convincingly demonstrated actual learning capability, creating a turning point for the field. The combination of gradient descent (optimization method) + backpropagation (gradient computation) + neural networks (model architecture) forms the trinity of modern deep learning.

## Momentum and Adaptive Methods

Pure SGD is noisy and converges slowly in narrow valley landscapes. Decades of research have addressed these issues.

Polyak's (1964) momentum was inspired by physical inertia. By maintaining memory of previous update directions, it accelerates in consistent directions and dampens oscillations. In v(t) = beta * v(t-1) + gradient(L), theta(t+1) = theta(t) - eta * v(t), beta is the inertia coefficient -- like a ball rolling downhill gaining speed.

Nesterov (1983) added a "look-ahead" to momentum, theoretically improving convergence speed. AdaGrad (Duchi et al., 2011) automatically adjusts the learning rate per parameter by accumulating past gradient magnitudes -- effective for sparse data but suffering from excessively decaying learning rates. RMSprop (Hinton, lecture slides 2012) solved AdaGrad's issue with exponential moving averages. Adam (Kingma & Ba, 2015) combined momentum and RMSprop, tracking both first moments (mean) and second moments (variance) simultaneously. With bias correction included, Adam is currently the most widely used optimizer in deep learning.

## Mini-batch: The Practical Compromise

In practice, neither pure SGD (single sample) nor batch GD (entire dataset) is standard -- mini-batch SGD is. Estimating gradients with 32-512 samples is effective for three reasons.

First, it efficiently utilizes GPU parallel computation. Matrix operations achieve higher hardware utilization with larger batch sizes. Second, gradient estimation variance is lower than pure SGD, stabilizing convergence. Third, the remaining noise prevents falling into sharp local minima -- an implicit regularization effect.

## The Rediscovery of SGD Noise

SGD's gradient noise was originally considered a drawback, but has been reevaluated in the overparameterized era. Smith & Le (2018) showed that SGD noise acts as an "effective temperature" determined by the learning rate/batch size ratio, causing optimization to prefer **flat minima** on the loss surface. Since flat minima correlate with generalization performance, SGD's "defect" paradoxically becomes an advantage.

Keskar et al. (2017) experimentally confirmed that large batches converge to sharp minima with worse generalization. This demonstrates that SGD's stochastic nature fundamentally affects learning quality beyond mere computational convenience.

## Limitations and Weaknesses

Gradient descent is modern AI's primary engine, but has clear inherent limitations.

- **Non-convex loss surfaces**: Deep learning loss functions are extremely non-convex. No theory guarantees reaching the global minimum. Choromanska et al. (2015) argued that saddle points are a bigger problem than local minima in high dimensions -- gradients near zero at saddle points cause training to stagnate.
- **Learning rate sensitivity**: Too large an eta causes divergence; too small causes extremely slow convergence. Finding appropriate learning rates is itself a non-trivial problem, and learning rate scheduling (warmup, cosine decay, cyclical learning rates) has formed a separate research area.
- **Ignoring curvature**: Pure gradient descent uses only first-order information (slope) and ignores second-order information (curvature). Newton's method uses curvature for faster convergence, but Hessian matrix computation requires O(n^2) memory and O(n^3) operations, making it impractical for large models. Approximate second-order methods like L-BFGS and K-FAC are under investigation.
- **Vanishing/exploding gradients**: In deep networks, gradients multiply during backpropagation and shrink or grow exponentially. Techniques like ResNet's (He et al., 2015) skip connections, batch normalization (Ioffe & Szegedy, 2015), and gradient clipping mitigate but do not fundamentally solve this problem.

## Glossary

Gradient - a vector collecting the partial derivatives of a multivariable function with respect to each variable, indicating the direction and magnitude of steepest increase

Learning rate - a positive scalar determining how far to move in the gradient direction at each update step

Stochastic approximation - a methodology for iteratively finding solutions using probabilistic estimates instead of exact values

Mini-batch - a subset of the full dataset used for gradient estimation in SGD

Momentum - a technique that maintains a weighted average of previous update directions to accelerate in consistent directions

Saddle point - a point that is a minimum in one direction and a maximum in another; more frequent than local minima in high-dimensional non-convex functions

Overparameterization - the state where the number of model parameters far exceeds the number of training data points; a general characteristic of modern deep learning

Implicit regularization - the effect by which SGD noise improves generalization performance without explicit regularization terms

Backpropagation - an algorithm that efficiently computes the gradient of the loss function with respect to each weight in a multi-layer neural network using the chain rule
