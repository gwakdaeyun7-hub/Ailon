---
difficulty: intermediate
connectionType: direct_inspiration
keywords: 보편 근사 정리, 존재 정리, 시그모이드, 은닉층, 너비와 깊이, 표현력, 신경망 이론적 근거, 깊이 분리
keywords_en: universal approximation theorem, existence theorem, sigmoid, hidden layer, width vs depth, expressiveness, neural network theoretical justification, depth separation
---
Universal Approximation Theorem - 신경망이 임의의 연속 함수를 근사할 수 있다는 이론적 보장이지만, 학습 가능성은 보장하지 않는다

## 정리의 탄생

1989년은 신경망 이론에 획기적인 해였다. George Cybenko는 시그모이드(sigmoid) 활성화 함수를 사용하는 단일 은닉층 신경망이 컴팩트 부분집합 위의 임의의 연속 함수를 원하는 정밀도로 근사할 수 있음을 증명했다. 거의 동시에 Kurt Hornik, Maxwell Stinchcombe, Halbert White(1989)는 이 결과를 더 넓은 범위의 활성화 함수로 일반화했다.

정리의 정확한 진술은 다음과 같다.

임의의 연속 함수 f: [0,1]^n -> R과 임의의 epsilon > 0에 대해, 단일 은닉층을 가진 신경망 g가 존재하여 모든 x에 대해 |f(x) - g(x)| < epsilon을 만족한다.

이 정리가 말하는 것은 명확하다. 신경망은 이론적으로 어떤 연속 함수든 얼마든지 정밀하게 흉내 낼 수 있다. 다항식, 삼각함수, 프랙탈 경계까지 포함하여 연속이기만 하면 신경망으로 근사할 수 있다.

## 존재 정리의 본질

보편 근사 정리의 가장 중요한 특성은 이것이 존재 정리(existence theorem)이지 구성 정리(construction theorem)가 아니라는 점이다. 이 구분은 수학에서 근본적이다.

존재 정리는 "이러한 성질을 가진 대상이 존재한다"만 말한다. 구성 정리는 "이 대상을 이렇게 만들 수 있다"를 알려준다. 보편 근사 정리는 전자에 해당한다. "그러한 신경망이 존재한다"를 증명하지만, 다음 네 가지 핵심 질문에는 침묵한다.

첫째, 은닉 뉴런이 몇 개 필요한가? 정리는 유한 개의 뉴런이면 충분하다고만 하지, 구체적 개수를 제시하지 않는다. 실제로 필요한 뉴런 수는 목표 함수의 복잡도에 따라 기하급수적으로 증가할 수 있다. 둘째, 그러한 가중치를 경사하강법(SGD)으로 찾을 수 있는가? 최적의 가중치 배열이 존재한다는 것과 SGD가 그것을 발견한다는 것은 전혀 다른 문제다. 셋째, 찾은 근사가 학습 데이터 바깥에서도 작동하는가? 정리는 일반화(generalization)에 대해 아무것도 말하지 않는다. 넷째, 계산 비용이 감당 가능한가? 이론적으로 가능하다는 것과 실용적으로 가능하다는 것은 별개다.

비유하자면, "서울에서 부산까지 도보로 갈 수 있다"는 존재 증명이다. 경로, 소요 시간, 필요한 체력은 알려주지 않는다.

## 활성화 함수의 역할과 확장

Cybenko의 원래 증명은 시그모이드 함수에 특정되었다. 핵심 성질은 시그모이드가 임계 함수(threshold function)의 연속 근사라는 점이었다. 충분히 많은 임계 함수를 조합하면 어떤 연속 함수든 계단식으로 근사할 수 있고, 시그모이드는 이 계단을 부드럽게 만든다.

Leshno et al.(1993)은 결정적 확장을 이루었다. 활성화 함수가 다항식이 아닌 한(non-polynomial), 보편 근사 성질이 성립한다는 것을 증명했다. 이는 ReLU (max(0, x)), tanh, 그리고 그 변형들 모두가 보편 근사기(universal approximator)임을 보장한다.

단, 다항식 활성화는 왜 제외되는가? n차 다항식의 합은 여전히 다항식이기 때문이다. 다항식 활성화를 가진 신경망은 아무리 넓어도 다항식 함수만 표현할 수 있으며, 비다항식 함수를 근사할 수 없다. 이것이 비선형성의 "올바른 종류"가 중요한 이유다.

## 너비 대 깊이: 표현력 논쟁

보편 근사 정리는 단일 은닉층(넓은 네트워크)으로 충분하다고 말하지만, 실전에서는 깊은 네트워크가 압도적으로 우세하다. 이 간극은 표현의 효율성 문제다.

Telgarsky(2016)는 깊이 분리(depth separation) 정리를 증명했다. k개의 레이어로 효율적으로 표현할 수 있는 함수 중, 2개의 레이어로 표현하려면 기하급수적으로 많은 뉴런이 필요한 함수가 존재한다는 것이다. 직관적으로, 깊은 네트워크는 함수의 합성(composition)을 통해 계층적 구조를 표현하므로, 같은 복잡도의 함수를 훨씬 적은 파라미터로 나타낼 수 있다.

Lu et al.(2017)은 이 논쟁에 정밀한 결과를 추가했다. 너비가 입력 차원 n + 1 이상이면 ReLU 네트워크가 보편 근사기이며, 너비가 n 이하이면 근사할 수 없는 연속 함수가 존재한다는 것을 보였다. 즉, 충분한 너비는 필요 조건이지만, 실용적으로는 깊이가 효율성을 결정한다.

ResNet(He et al., 2015)의 잔차 연결(skip connection)은 이 깊이 효율성을 실제로 활용할 수 있게 한 공학적 돌파구다. 잔차 연결 없이는 매우 깊은 네트워크의 학습이 사실상 불가능했으며, 이론적 깊이 이점을 실현할 수 없었다.

## AI에서의 역할: 정당화와 한계

보편 근사 정리는 신경망 연구 프로그램 전체의 이론적 정당화로 기능했다. "신경망으로 충분히 복잡한 함수를 표현할 수 있는가?"라는 근본 질문에 긍정적으로 답함으로써, 연구자들이 아키텍처 설계와 학습 알고리즘에 집중할 수 있는 토대를 놓았다.

그러나 현대 딥러닝의 성공은 보편 근사 정리로 설명되지 않는다. 딥러닝이 작동하는 이유는 근사 가능성 때문이 아니라, (1) 자연적 데이터의 구조적 규칙성(계층적 특징, 국소적 상관관계)이 깊은 네트워크의 구조와 맞아떨어지고, (2) SGD가 경험적으로 좋은 해를 찾아내며, (3) 과파라미터화(overparameterization)된 모델이 의외로 잘 일반화하기 때문이다.

특히 세 번째 현상은 고전적 통계 학습 이론(bias-variance tradeoff)에 정면으로 모순된다. 파라미터가 데이터보다 훨씬 많은 모델이 과적합 없이 일반화하는 이중 하강(double descent) 현상(Belkin et al., 2019)은 보편 근사 정리의 범위를 완전히 벗어나는 주제다.

## 다른 보편 근사기들과의 비교

보편 근사 성질은 신경망만의 특권이 아니다. Stone-Weierstrass 정리(1937)는 다항식이 연속 함수의 보편 근사기임을 이미 증명했다. 푸리에 급수, 웨이블릿, 커널 함수 등도 보편 근사 성질을 가진다. 그렇다면 신경망의 우위는 어디에 있는가?

핵심 차이는 차원의 저주(curse of dimensionality)에 대한 저항력이다. 다항식이나 푸리에 기저로 고차원 함수를 근사하면, 필요한 기저 함수 수가 차원에 대해 기하급수적으로 증가한다. 반면 신경망은 합성 구조(compositional structure)를 활용하여 특정 유형의 고차원 함수를 효율적으로 근사할 수 있다. 물론 이 효율성은 자연적 데이터에 존재하는 특정 구조(계층성, 국소성)에 의존하며, 모든 고차원 함수에 대해 성립하지는 않는다.

## 한계와 약점

보편 근사 정리가 제공하지 않는 것을 정확히 이해하는 것이 이 정리를 올바르게 이해하는 핵심이다.

- 학습 불가능성: 보편 근사 정리는 최적의 가중치가 존재한다고만 말할 뿐, SGD나 Adam이 그것을 찾을 수 있다는 보장은 없다. NP-hard 최적화 문제를 포함하여, 이론적으로 근사 가능하지만 학습 불가능한 문제가 존재한다.
- 뉴런 수의 기하급수적 증가: Barron(1993)은 특정 부드러움 조건을 만족하는 함수에 대해 뉴런 수에 대한 근사 오차 바운드를 제시했지만, 일반적인 연속 함수에 대해서는 필요한 뉴런 수가 차원에 대해 기하급수적으로 증가할 수 있다.
- 일반화 침묵: 유한한 학습 데이터로 학습한 모델이 본 적 없는 데이터에서도 잘 작동하는지는 이 정리의 범위 밖이다. PAC 학습 이론, VC 차원, Rademacher 복잡도 등 별도의 이론적 도구가 필요하다.
- 불연속 함수 제외: 정리는 연속 함수만 다룬다. 불연속 분류 경계를 가진 문제에 직접 적용할 수 없다(실제로는 시그모이드의 연속적 출력을 임계값으로 이산화하여 분류에 사용하지만, 이는 정리의 직접적 결과가 아니다).
- 현대 딥러닝 설명 실패: Transformer, CNN, GNN 등 현대 아키텍처의 성공 이유를 이 정리로는 설명할 수 없다. 이들의 성공은 아키텍처의 귀납적 편향(inductive bias)과 데이터 구조의 정합성에서 비롯되며, 단순한 근사 능력과는 별개의 문제다.

## 용어 정리

보편 근사 정리(universal approximation theorem) - 충분히 넓은 단일 은닉층 신경망이 컴팩트 집합 위의 임의의 연속 함수를 원하는 정밀도로 근사할 수 있다는 정리

존재 정리(existence theorem) - 특정 성질을 가진 수학적 대상이 존재함을 증명하는 정리. 대상의 구성 방법은 제시하지 않음

시그모이드(sigmoid) - sigma(x) = 1/(1+e^(-x)) 형태의 S자형 활성화 함수. Cybenko 원래 증명의 기반

깊이 분리(depth separation) - 깊은 네트워크가 얕은 네트워크보다 기하급수적으로 적은 뉴런으로 특정 함수를 표현할 수 있다는 이론적 결과

차원의 저주(curse of dimensionality) - 입력 차원이 증가할 때 필요한 데이터나 계산 자원이 기하급수적으로 증가하는 현상

귀납적 편향(inductive bias) - 학습 알고리즘이나 아키텍처가 특정 유형의 해를 선호하도록 내재된 가정

과파라미터화(overparameterization) - 모델 파라미터 수가 학습 데이터 수를 크게 초과하는 상태

이중 하강(double descent) - 모델 복잡도 증가 시 오류가 한 번 증가했다가 다시 감소하는 현상. 고전적 편향-분산 트레이드오프에 반하는 관찰

잔차 연결(skip connection) - 레이어의 입력을 출력에 직접 더하는 구조. 깊은 네트워크의 학습을 가능하게 함

---EN---
Universal Approximation Theorem - A theoretical guarantee that neural networks can approximate any continuous function, but with no guarantee of learnability

## Birth of the Theorem

1989 was a landmark year for neural network theory. George Cybenko proved that a single hidden layer neural network with sigmoid activation can approximate any continuous function on a compact subset to any desired precision. Nearly simultaneously, Kurt Hornik, Maxwell Stinchcombe, and Halbert White (1989) generalized this result to a broader class of activation functions.

The precise statement of the theorem is:

For any continuous function f: [0,1]^n -> R and any epsilon > 0, there exists a neural network g with a single hidden layer such that |f(x) - g(x)| < epsilon for all x.

What the theorem states is clear: neural networks can theoretically mimic any continuous function to arbitrary precision. Polynomials, trigonometric functions, and even fractal boundaries -- as long as they are continuous, they can be approximated by a neural network.

## The Nature of an Existence Theorem

The most important characteristic of the universal approximation theorem is that it is an existence theorem, not a construction theorem. This distinction is fundamental in mathematics.

An existence theorem says only that "an object with these properties exists." A construction theorem tells you "how to build this object." The universal approximation theorem belongs to the former. It proves "such a neural network exists" but remains silent on four critical questions.

First, how many hidden neurons are needed? The theorem says only that a finite number suffices, without specifying how many. The actual number may grow exponentially with the target function's complexity. Second, can gradient descent (SGD) find those weights? The existence of an optimal weight configuration and SGD's ability to discover it are entirely different matters. Third, does the approximation work beyond the training data? The theorem says nothing about generalization. Fourth, is the computational cost feasible? Theoretical possibility and practical feasibility are separate concerns.

By analogy, "you can walk from Seoul to Busan" is an existence proof. It tells you nothing about the route, time required, or physical stamina needed.

## The Role of Activation Functions and Extensions

Cybenko's original proof was specific to the sigmoid function. The key property was that the sigmoid is a continuous approximation to the threshold function. Combining sufficiently many threshold functions can approximate any continuous function in a step-wise manner, and the sigmoid smooths these steps.

Leshno et al. (1993) achieved a decisive extension, proving that the universal approximation property holds as long as the activation function is non-polynomial. This guarantees that ReLU (max(0, x)), tanh, and their variants are all universal approximators.

But why are polynomial activations excluded? Because the sum of n-th degree polynomials is still a polynomial. A neural network with polynomial activation, no matter how wide, can only represent polynomial functions and cannot approximate non-polynomial ones. This is why the "right kind" of nonlinearity matters.

## Width vs. Depth: The Expressiveness Debate

The universal approximation theorem says a single hidden layer (wide network) suffices, yet in practice, deep networks overwhelmingly dominate. This gap is a matter of representational efficiency.

Telgarsky (2016) proved a depth separation theorem: there exist functions that can be efficiently represented with k layers but require exponentially many neurons with just 2 layers. Intuitively, deep networks express hierarchical structure through function composition, representing functions of equal complexity with far fewer parameters.

Lu et al. (2017) added precise results to this debate. They showed that ReLU networks are universal approximators when width is at least n + 1 (where n is input dimension), and that there exist continuous functions that cannot be approximated when width is n or less. Sufficient width is a necessary condition, but practically, depth determines efficiency.

ResNet's (He et al., 2015) skip connections were the engineering breakthrough that enabled actually exploiting this depth efficiency. Without skip connections, training very deep networks was practically impossible, and the theoretical depth advantage could not be realized.

## Role in AI: Justification and Limits

The universal approximation theorem served as theoretical justification for the entire neural network research program. By affirmatively answering the fundamental question "can neural networks represent sufficiently complex functions?", it laid the foundation for researchers to focus on architecture design and learning algorithms.

However, the success of modern deep learning is not explained by the universal approximation theorem. Deep learning works not because of approximation capability, but because (1) the structural regularities of natural data (hierarchical features, local correlations) align with deep network architecture, (2) SGD empirically finds good solutions, and (3) overparameterized models generalize surprisingly well.

The third phenomenon directly contradicts classical statistical learning theory (bias-variance tradeoff). The double descent phenomenon (Belkin et al., 2019), where models with far more parameters than data generalize without overfitting, lies completely outside the scope of the universal approximation theorem.

## Comparison with Other Universal Approximators

Universal approximation is not unique to neural networks. The Stone-Weierstrass theorem (1937) already proved that polynomials are universal approximators of continuous functions. Fourier series, wavelets, and kernel functions also possess universal approximation properties. So where lies the advantage of neural networks?

The key difference is resistance to the curse of dimensionality. Approximating high-dimensional functions with polynomial or Fourier bases requires a number of basis functions that grows exponentially with dimension. Neural networks, by exploiting compositional structure, can efficiently approximate certain types of high-dimensional functions. Of course, this efficiency depends on specific structures present in natural data (hierarchy, locality) and does not hold for all high-dimensional functions.

## Limitations and Weaknesses

Precisely understanding what the universal approximation theorem does NOT provide is the key to correctly understanding this theorem.

- Unlearnability: The theorem only states that optimal weights exist; it provides no guarantee that SGD or Adam can find them. There exist problems that are theoretically approximable but unlearnable, including NP-hard optimization problems.
- Exponential neuron growth: Barron (1993) provided approximation error bounds relative to neuron count for functions satisfying certain smoothness conditions, but for general continuous functions, the required number of neurons may grow exponentially with dimension.
- Silence on generalization: Whether a model trained on finite training data performs well on unseen data lies outside this theorem's scope. Separate theoretical tools such as PAC learning theory, VC dimension, and Rademacher complexity are needed.
- Exclusion of discontinuous functions: The theorem covers only continuous functions. It cannot directly apply to problems with discontinuous classification boundaries (in practice, sigmoid's continuous output is thresholded for classification, but this is not a direct consequence of the theorem).
- Failure to explain modern deep learning: The success of modern architectures like Transformers, CNNs, and GNNs cannot be explained by this theorem. Their success stems from the alignment between architectural inductive biases and data structure -- a matter separate from mere approximation capability.

## Glossary

Universal approximation theorem - a theorem proving that a sufficiently wide single hidden layer neural network can approximate any continuous function on a compact set to arbitrary precision

Existence theorem - a theorem proving that a mathematical object with specific properties exists, without providing a method for constructing it

Sigmoid - an S-shaped activation function of the form sigma(x) = 1/(1+e^(-x)), the basis of Cybenko's original proof

Depth separation - a theoretical result showing that deep networks can represent certain functions with exponentially fewer neurons than shallow networks

Curse of dimensionality - the phenomenon where required data or computational resources grow exponentially as input dimension increases

Inductive bias - assumptions inherent in a learning algorithm or architecture that favor certain types of solutions

Overparameterization - a state where the number of model parameters greatly exceeds the number of training data points

Double descent - a phenomenon where error first increases then decreases again as model complexity grows, contradicting the classical bias-variance tradeoff

Skip connection - a structure that directly adds a layer's input to its output, enabling training of deep networks
